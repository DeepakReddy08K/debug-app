import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const { theme } = useTheme();
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      padding: '20px'
    }}>
      <h1>Dashboard — current theme: {theme}</h1>
    </div>
  );
};

export default Dashboard;