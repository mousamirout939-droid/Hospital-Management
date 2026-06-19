export const Spinner = () => <span className="spinner" />;

export const LoadingScreen = ({ message = 'Loading…' }) => (
  <div className="loading-screen">
    <Spinner />
    <p>{message}</p>
  </div>
);

export default LoadingScreen;
