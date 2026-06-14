import React, { useReducer, useMemo, useCallback } from 'react';
import type { AppState, AppAction, User, TableRequest, Participant, ChatMessage } from '@/types';
import { getMockTables, getMockMessages, joinTable, createMessage } from '@/data';
import Register from '@/components/Register';
import Hall from '@/components/Hall';
import TableDetail from '@/components/TableDetail';

const initialState: AppState = {
  currentUser: null,
  currentView: 'register',
  selectedTableId: null,
  tables: [],
  messages: {},
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'REGISTER_USER': {
      return {
        ...state,
        currentUser: action.payload,
        currentView: 'hall',
        tables: getMockTables(),
        messages: getMockMessages(),
      };
    }
    case 'SET_VIEW': {
      return { ...state, currentView: action.payload };
    }
    case 'SELECT_TABLE': {
      return {
        ...state,
        selectedTableId: action.payload,
        currentView: action.payload ? 'detail' : 'hall',
      };
    }
    case 'CREATE_TABLE': {
      return {
        ...state,
        tables: [action.payload, ...state.tables],
        messages: {
          ...state.messages,
          [action.payload.id]: [],
        },
      };
    }
    case 'JOIN_TABLE': {
      const { tableId, participant } = action.payload;
      const newTables = state.tables.map((t) =>
        t.id === tableId ? joinTable(t, participant) : t
      );
      const table = newTables.find((t) => t.id === tableId);
      let newMessages = { ...state.messages };
      if (table && !newMessages[tableId]) {
        newMessages[tableId] = [];
      }
      return { ...state, tables: newTables, messages: newMessages };
    }
    case 'SEND_MESSAGE': {
      const msg = action.payload;
      const existing = state.messages[msg.tableId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [msg.tableId]: [...existing, msg],
        },
      };
    }
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const selectedTable = useMemo(() => {
    if (!state.selectedTableId) return null;
    return state.tables.find((t) => t.id === state.selectedTableId) || null;
  }, [state.tables, state.selectedTableId]);

  const selectedMessages = useMemo(() => {
    if (!state.selectedTableId) return [];
    return state.messages[state.selectedTableId] || [];
  }, [state.messages, state.selectedTableId]);

  const handleRegister = useCallback((user: User) => {
    dispatch({ type: 'REGISTER_USER', payload: user });
  }, []);

  const handleSelectTable = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_TABLE', payload: id });
  }, []);

  const handleBackToHall = useCallback(() => {
    dispatch({ type: 'SELECT_TABLE', payload: null });
  }, []);

  const handleCreateTable = useCallback((table: TableRequest) => {
    dispatch({ type: 'CREATE_TABLE', payload: table });
  }, []);

  const handleJoinTable = useCallback((tableId: string, participant: Participant) => {
    dispatch({ type: 'JOIN_TABLE', payload: { tableId, participant } });
  }, []);

  const handleSendMessage = useCallback((tableId: string, user: User, content: string) => {
    const msg = createMessage(tableId, user, content);
    dispatch({ type: 'SEND_MESSAGE', payload: msg });
  }, []);

  return (
    <div className="app-container">
      {state.currentView === 'register' && !state.currentUser && (
        <Register onComplete={handleRegister} />
      )}

      {state.currentView === 'hall' && state.currentUser && (
        <Hall
          tables={state.tables}
          currentUser={state.currentUser}
          onSelectTable={handleSelectTable}
          onCreateTable={handleCreateTable}
        />
      )}

      {state.currentView === 'detail' && state.currentUser && selectedTable && (
        <TableDetail
          table={selectedTable}
          messages={selectedMessages}
          currentUser={state.currentUser}
          onBack={handleBackToHall}
          onJoin={(participant) => handleJoinTable(selectedTable.id, participant)}
          onSendMessage={(content) =>
            handleSendMessage(selectedTable.id, state.currentUser!, content)
          }
        />
      )}
    </div>
  );
};

export default App;
