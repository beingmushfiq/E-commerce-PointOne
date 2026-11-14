import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { MotionProvider } from './contexts/MotionContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <CurrencyProvider>
          <MotionProvider>
            <AppRoutes />
          </MotionProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
