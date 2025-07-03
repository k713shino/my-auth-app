'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { useState, useEffect, useCallback } from 'react';
import { TodoApp } from './components/TodoComponents';

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
  <div className="loading">
    <p>読み込み中...</p>
  </div>
);

// コンポーネント: エラー表示
const ErrorComponent = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="message message-error">
      <p>{error}</p>
    </div>
  );
};

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

// コンポーネント: ユーザーコンテンツ
const UserContent = ({ user, onSignOut, error }) => (
  <div className="welcome-container">
    <h1>個人用Todoアプリへようこそ！</h1>
    <div className="user-content">
      <div className="user-info">
        <p>ログイン中: <strong>{user.username}</strong></p>
        <p>ユーザーID: <code>{user.userId}</code></p>
      </div>
      <div>
        <ErrorComponent error={error} />
        <button 
          onClick={onSignOut}
          className="button button-danger"
        >
          ログアウト
        </button>
      </div>
      <TodoApp user={user} />
    </div>
  </div>
);

// コンポーネント: サインイン前の説明表示
const WelcomeContent = ({ error }) => (
  <>
    <h1>個人用Todoアプリへようこそ！</h1>
    <div className="description">
      <p>あなた専用のTodoリストを管理できるアプリです。</p>
      <p>ログインして、タスクの作成、編集、完了管理を始めましょう！</p>
    </div>
    <ErrorComponent error={error} />
  </>
);

// メインコンポーネント
export default function Home() {
  const { user, loading, error, handleSignOut, setUser, setError } = useAuth();

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <div className="welcome-container">
      <Authenticator
        signUpAttributes={['email']}
        formFields={FORM_FIELDS}
        socialProviders={[]}
        className="auth-form"
        components={{
          Header: () => <WelcomeContent error={error} />
        }}
        messages={{
          'ja': {
            'Sign In': 'ログイン',
            'Sign Up': '新規登録',
            'Enter your Username': 'ユーザー名を入力',
            'Enter your Password': 'パスワードを入力',
            'Forgot your password?': 'パスワードをお忘れですか？',
            'Reset Password': 'パスワードをリセット',
            'Send code': 'コードを送信',
            'Back to Sign In': 'ログインに戻る',
            'Confirm Sign Up': '登録を確認',
            'Confirmation Code': '確認コード',
            'Enter your code': 'コードを入力してください',
            'Create Account': 'アカウントを作成',
            'Have an account?': 'アカウントをお持ちですか？',
            'Sign in': 'ログイン',
            'No account?': 'アカウントをお持ちでない方',
            'Create account': 'アカウントを作成',
            'Reset your password': 'パスワードをリセット',
            'Submit': '送信',
            'Skip': 'スキップ',
            'Verify': '確認',
            'Verify Contact': '連絡先を確認',
            'Invalid verification code provided, please try again.': '無効な確認コードです。もう一度お試しください。',
            'User already exists': 'このユーザーは既に存在します',
            'Incorrect username or password': 'ユーザー名またはパスワードが正しくありません',
            'User does not exist': 'ユーザーが存在しません'
          }
        }}
      >
        {({ signOut, user: authUser }) => {
          if (authUser) {
            return (
              <UserContent 
                user={authUser}
                onSignOut={() => {
                  signOut();
                  setUser(null);
                }}
                error={error}
              />
            );
          }
          return null;
        }}
      </Authenticator>
    </div>
  );
}
