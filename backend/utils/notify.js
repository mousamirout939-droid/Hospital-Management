const Notification = require('../models/Notification');
const { sendEmail } = require('../config/email');

const formatAppointmentDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatAppointmentTime = (timeSlot) => {
  if (!timeSlot) return '—';
  return timeSlot;
};

/**
 * Creates an in-app notification for a user. Fails silently (logs only)
 * so notification issues never break the primary request flow.
 */
const createNotification = async ({ user, title, message, type = 'general', relatedId = null }) => {
  try {
    await Notification.create({ user, title, message, type, relatedId });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

const sendSms = async ({ phone, message }) => {
  if (!phone) return { sent: false, reason: 'No phone number' };

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio SMS not configured. SMS notifications will be skipped.');
    return { sent: false, reason: 'Twilio not configured' };
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone.startsWith('+') ? phone : `+${phone}`,
        From: fromNumber,
        Body: message,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('SMS send failed:', text);
      return { sent: false, reason: text };
    }

    return { sent: true };
  } catch (error) {
    console.error('SMS send failed:', error.message);
    return { sent: false, reason: error.message };
  }
};

const sendAppointmentConfirmationNotifications = async ({ appointment, patient, doctor, hospitalName = 'MediCare Hospital' }) => {
  if (!appointment || !patient || !doctor) return;

  const tokenText = appointment.tokenNumber ? `Token Number: ${appointment.tokenNumber}` : 'Token Number: Pending';
  const appointmentDate = formatAppointmentDate(appointment.appointmentDate);
  const appointmentTime = formatAppointmentTime(appointment.timeSlot);

  if (patient.email) {
    await sendEmail({
      to: patient.email,
      subject: 'Appointment Confirmed – Hospital Management System',
      html: `
        <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:24px; color:#1f2937;">
          <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
            <div style="background:#0f766e; color:#ffffff; padding:20px 24px; font-size:22px; font-weight:700;">Appointment Confirmed</div>
            <div style="padding:24px;">
              <p style="margin:0 0 16px; font-size:16px;">Hello ${patient.name || 'Patient'},</p>
              <p style="margin:0 0 20px; line-height:1.6;">Your appointment has been successfully confirmed.</p>
              <h3 style="margin:0 0 12px; font-size:18px;">Appointment Details</h3>
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; line-height:1.8;">
                <div><strong>Patient:</strong> ${patient.name || 'Patient'}</div>
                <div><strong>Doctor:</strong> Dr. ${doctor.name}</div>
                <div><strong>Department:</strong> ${doctor.department || doctor.specialization || 'General'}</div>
                <div><strong>Date:</strong> ${appointmentDate}</div>
                <div><strong>Appointment Time:</strong> ${appointmentTime}</div>
                <div><strong>Token Number:</strong> ${tokenText}</div>
                <div><strong>Hospital:</strong> ${hospitalName}</div>
              </div>
              <p style="margin:20px 0 0; line-height:1.6;">Please arrive at the hospital 15–20 minutes before your scheduled appointment time.</p>
              <p style="margin:16px 0 0; line-height:1.6;">Thank you for choosing our hospital.</p>
              <p style="margin:20px 0 0; font-weight:700;">Hospital Management System</p>
            </div>
          </div>
        </div>
      `,
      text: `Hello ${patient.name || 'Patient'},\n\nYour appointment has been successfully confirmed.\n\nAppointment Details:\n- Patient: ${patient.name || 'Patient'}\n- Doctor: Dr. ${doctor.name}\n- Department: ${doctor.department || doctor.specialization || 'General'}\n- Date: ${appointmentDate}\n- Appointment Time: ${appointmentTime}\n- Token Number: ${tokenText}\n- Hospital: ${hospitalName}\n\nPlease arrive at the hospital 15–20 minutes before your scheduled appointment time.\n\nThank you for choosing our hospital.\n\nHospital Management System`,
    });
  }

  if (patient.phone) {
    const smsMessage = `Appointment Confirmed! Dear ${patient.name || 'Patient'}, your appointment with Dr. ${doctor.name} is confirmed for ${appointmentDate} at ${appointmentTime}. Token: ${appointment.tokenNumber || 'Pending'}. Please arrive 15-20 minutes early.`;
    await sendSms({ phone: patient.phone, message: smsMessage });
  }

  await createNotification({
    user: patient._id || patient,
    title: 'Appointment Confirmed',
    message: `Your appointment with Dr. ${doctor.name} has been confirmed for ${appointmentDate} at ${appointmentTime}.`,
    type: 'appointment-confirmed',
    relatedId: appointment._id,
  });
};

module.exports = { createNotification, sendAppointmentConfirmationNotifications };
