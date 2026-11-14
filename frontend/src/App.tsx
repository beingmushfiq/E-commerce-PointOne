import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { MotionProvider } from './contexts/MotionContext';
import { SmoothScroll } from './components/SmoothScroll';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <CurrencyProvider>
          <MotionProvider>
            <SmoothScroll>
              <AppRoutes />
            </SmoothScroll>
          </MotionProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
