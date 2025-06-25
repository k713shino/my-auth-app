'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { useState, useEffect } from 'react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('ユーザーがログインしていません');
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.log('サインアウトエラー:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>ようこそ！</h1>
        <p>こんにちは、{user.username}さん</p>
        <p>ユーザーID: {user.userId}</p>
        <button 
          onClick={handleSignOut}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>会員登録システム</h1>
      <Authenticator
        signUpAttributes={['email']}
        formFields={{
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
            },
            email: {
              order: 2,
              placeholder: 'メールアドレスを入力してください',
              label: 'メールアドレス',
            },
            password: {
              order: 3,
              placeholder: 'パスワードを入力してください',
              label: 'パスワード',
            },
            confirm_password: {
              order: 4,
              placeholder: 'パスワードを再入力してください',
              label: 'パスワード確認',
            },
          },
        }}
      >
        {({ signOut, user }) => (
          <div style={{ textAlign: 'center' }}>
            <h2>ログイン成功！</h2>
            <p>ようこそ、{user.username}さん</p>
            <button 
              onClick={signOut}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              ログアウト
            </button>
          </div>
        )}
      </Authenticator>
    </div>
  );
}