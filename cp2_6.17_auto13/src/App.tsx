import React, { useState } from 'react';
import { useSeatStore } from './stores/seatStore';
import OfficeMap from './modules/seating/components/OfficeMap';
import EmployeeList from './modules/seating/components/EmployeeList';
import SwapRequestPanel from './modules/approval/components/SwapRequestPanel';

type MobileTab = 'map' | 'approval';

const App: React.FC = () => {
  const initialized = useSeatStore((s) => s.initialized);
  const [mobileTab, setMobileTab] = useState<MobileTab>('map');

  if (!initialized) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#888888',
          fontSize: 16,
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <div className="app-container">
      <header
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid #333344',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #5C6BC0, #42A5F5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: '#FFFFFF',
            fontWeight: 700,
          }}
        >
          S
        </div>
        <h1 style={{ fontSize: 20, color: '#E0E0E0', fontWeight: 600, margin: 0 }}>
          SeatSync
        </h1>
        <span style={{ fontSize: 13, color: '#888888', marginLeft: 4 }}>
          办公座位排布与换座管理
        </span>
      </header>

      <div className="main-layout">
        <div className="office-map-wrapper desktop-only">
          <OfficeMap />
          <div className="employee-list-inline">
            <EmployeeList />
          </div>
        </div>
        <div className="side-panel">
          <div className="employee-list-wrapper">
            <EmployeeList />
          </div>
          <div className="swap-panel-wrapper">
            <SwapRequestPanel />
          </div>
        </div>
      </div>

      <div className="mobile-layout">
        <div
          className={`mobile-pane ${mobileTab === 'map' ? 'mobile-pane-active' : ''}`}
        >
          <OfficeMap />
          <EmployeeList />
        </div>
        <div
          className={`mobile-pane ${mobileTab === 'approval' ? 'mobile-pane-active' : ''}`}
        >
          <SwapRequestPanel />
        </div>
      </div>

      <div className="mobile-tab-bar">
        <button
          className={`mobile-tab ${mobileTab === 'map' ? 'active' : ''}`}
          onClick={() => setMobileTab('map')}
        >
          座位图
        </button>
        <button
          className={`mobile-tab ${mobileTab === 'approval' ? 'active' : ''}`}
          onClick={() => setMobileTab('approval')}
        >
          审批
        </button>
      </div>

      <style>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #1A1A2C;
        }

        .main-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .office-map-wrapper {
          flex: 0 0 60%;
          overflow: auto;
          border-right: 1px solid #333344;
        }

        .employee-list-inline {
          display: none;
        }

        .side-panel {
          flex: 0 0 40%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .employee-list-wrapper {
          flex: 1;
          overflow: auto;
          border-bottom: 1px solid #333344;
        }

        .swap-panel-wrapper {
          flex: 1;
          overflow: auto;
        }

        .mobile-tab-bar {
          display: none;
        }

        .mobile-layout {
          display: none;
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .main-layout {
            flex-direction: column;
          }
          .office-map-wrapper {
            flex: 0 0 50%;
            border-right: none;
            border-bottom: 1px solid #333344;
          }
          .side-panel {
            flex-direction: row;
            flex: 0 0 50%;
          }
          .employee-list-wrapper {
            border-bottom: none;
            border-right: 1px solid #333344;
          }
        }

        @media (max-width: 767px) {
          .main-layout {
            display: none;
          }
          .mobile-layout {
            display: block;
            flex: 1;
            overflow: hidden;
            padding-bottom: 56px;
            position: relative;
          }
          .mobile-pane {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: auto;
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.15s ease;
          }
          .mobile-pane-active {
            visibility: visible;
            opacity: 1;
          }
          .mobile-tab-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 48px;
            background-color: #1A1A2C;
            border-top: 1px solid #333344;
            z-index: 100;
          }
          .mobile-tab {
            flex: 1;
            background: none;
            border: none;
            color: #E0E0E0;
            font-size: 14px;
            cursor: pointer;
            position: relative;
            transition: font-weight 0.15s ease;
          }
          .mobile-tab.active {
            font-weight: 700;
          }
          .mobile-tab.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 20%;
            right: 20%;
            height: 2px;
            background-color: #4CAF50;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
