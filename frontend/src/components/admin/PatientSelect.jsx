import { useState, useEffect, useRef } from 'react';
import { userService } from '../../services/userService';

const PatientSelect = ({ value, onChange, label = 'Patient', required = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      userService.getAllPatients({ search: query, limit: 8 }).then((res) => setResults(res.data.data));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (patient) => {
    onChange(patient._id);
    setSelectedLabel(`${patient.name} (${patient.email})`);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="field-group" ref={wrapRef} style={{ position: 'relative' }}>
      <label className="field-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        className="field-input"
        value={open ? query : selectedLabel}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search patient by name or email…"
      />
      {open && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--color-paper-raised)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 20,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {results.map((p) => (
            <div
              key={p._id}
              onClick={() => handleSelect(p)}
              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.88rem', borderBottom: '1px solid var(--color-border)' }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-faint)' }}>{p.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientSelect;
