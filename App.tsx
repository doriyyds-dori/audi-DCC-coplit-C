
import React, { useState } from 'react';
import Layout from './components/Layout';
import Copilot from './components/Copilot';
import Dashboard from './components/Dashboard';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.COPILOT);

  console.log("Rendering App view:", currentView);

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {currentView === ViewState.COPILOT && <Copilot />}
      {currentView === ViewState.DASHBOARD && <Dashboard />}
    </Layout>
  );
};

export default App;
