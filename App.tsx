import React from 'react';
import Layout from './components/Layout';
import Copilot from './components/Copilot';
import { ViewState } from './types';

const App: React.FC = () => {
  // Hardcoded to Copilot for focused development
  const currentView = ViewState.COPILOT;

  return (
    <Layout currentView={currentView} onChangeView={() => {}}>
      <Copilot />
    </Layout>
  );
};

export default App;