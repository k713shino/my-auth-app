'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { useState, useEffect, useCallback } from 'react';
import { TodoApp } from './components/TodoComponents';

// スタイル定数
const STYLES = {
  container: {
    padding: '20px',
    textAlign: 'center',
  },
  welcomeContainer: {
    padding: '20px',
    textAlign: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userInfo: {
    textAlign: 'left',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2rem',
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
  },
  errorContainer: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#ffeaea',
    borderRadius: '5px',
    border: '1px solid #ffcccb',
  },
  authContainer: {
    maxWidth: '520px',
    margin: '0 auto',
  },
  description: {
    marginBottom: '30px',
    color: '#666',
    fontSize: '16px',
    lineHeight: '1.5',
  },
};

// カスタムフック: 認証状態管理
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkUser = useCallback(async () => {
    try {
      setError(null);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('ユーザーがログインしていません:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      setError(null);
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('サインアウトエラー:', error);
      setError('サインアウトに失敗しました。もう一度お試しください。');
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return { user, loading, error, handleSignOut, setUser, setError };
};

// コンポーネント: ローディング表示
const LoadingComponent = () => (
  <div style={STYLES.loading}>
    <p>読み込み中...</p>
  </div>
);

// コンポーネント: エラー表示
const ErrorComponent = ({ error }) => {
  if (!error) return null;
  
  return (
    <div style={STYLES.errorContainer}>
      <p>{error}</p>
    </div>
  );
};

// コンポーネント: ヘッダー
const Header = ({ user, onSignOut, error }) => (
  <div style={STYLES.header}>
    <div style={STYLES.userInfo}>
      <h2>個人用Todoアプリへようこそ！</h2>
      <p>ログイン中: <strong>{user.username}</strong></p>
      <p>ユーザーID: <code>{user.userId}</code></p>
    </div>
    
    <div>
      <ErrorComponent error={error} />
      <button 
        onClick={onSignOut}
        style={STYLES.button}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#e03e3e';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#ff4444';
        }}
      >
        ログアウト
      </button>
    </div>
  </div>
);

// フォームフィールド設定
const FORM_FIELDS = {
  signIn: {
    username: {
      placeholder: 'ユーザー名を入力してください',
      label: 'ユーザー名',
      isRequired: true,
      labelHidden: false,
    },
    password: {
      placeholder: 'パスワードを入力してください', 
      label: 'パスワード',
      isRequired: true,
      labelHidden: false,
    },
  },
  signUp: {
    username: {
      order: 1,
      placeholder: 'ユーザー名を入力してください',
      label: 'ユーザー名',
      isRequired: true,
    },
    email: {
      order: 2,
      placeholder: 'メールアドレスを入力してください',
      label: 'メールアドレス',
      isRequired: true,
    },
    password: {
      order: 3,
      placeholder: 'パスワードを入力してください',
      label: 'パスワード',
      isRequired: true,
    },
    confirm_password: {
      order: 4,
      placeholder: 'パスワードを再入力してください',
      label: 'パスワード確認',
      isRequired: true,
    },
  },
};

// メインコンポーネント
export default function Home() {
  const { user, loading, error, handleSignOut, setUser, setError } = useAuth();

  if (loading) {
    return <LoadingComponent />;
  }

  if (user) {
    return (
      <div style={STYLES.welcomeContainer}>
        <Header 
          user={user} 
          onSignOut={handleSignOut} 
          error={error}
        />
        
        <TodoApp user={user} />
      </div>
    );
  }

  return (
    <div style={STYLES.container}>
      <h1 style={STYLES.title}>個人用Todoアプリ</h1>
      <div style={STYLES.description}>
        <p>あなた専用のTodoリストを管理できるアプリです。</p>
        <p>ログインして、タスクの作成、編集、完了管理を始めましょう！</p>
      </div>
      
      <ErrorComponent error={error} />
      
      <div style={STYLES.authContainer}>
        <Authenticator
          signUpAttributes={['email']}
          formFields={FORM_FIELDS}
          socialProviders={[]}
        >
          {({ signOut, user }) => (
            <div style={STYLES.welcomeContainer}>
              <Header 
                user={user} 
                onSignOut={() => {
                  signOut();
                  setUser(null);
                  setError(null);
                }} 
                error={error}
              />
              
              <TodoApp user={user} />
            </div>
          )}
        </Authenticator>
      </div>
    </div>
  );
}
