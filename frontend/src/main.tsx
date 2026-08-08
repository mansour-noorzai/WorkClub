import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './store';
import './styles.css';

// Load runtime config before mounting the app so API baseURL is available.
import { loadRuntimeConfig } from './config';

async function bootstrap() {
  await loadRuntimeConfig();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
}

bootstrap();
