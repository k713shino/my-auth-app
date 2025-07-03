'use client';

import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './globals.css';
import './styles/auth.css';
import './styles/components.css';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeSwitcher } from './components/ThemeSwitcher';

// 動的にaws-exportsを読み込み、エラーハンドリングを追加
const configureAmplify = () => {
  try {
    // aws-exports.jsの読み込みを試行
    const awsExports = require('../aws-exports');
    
    // 設定が正しいかチェック
    if (awsExports.default && awsExports.default.aws_user_pools_id) {
      console.log('Amplify configuration loaded successfully');
      Amplify.configure(awsExports.default);
      return true;
    } else {
      console.error('AWS exports file exists but missing user pool configuration');
      return false;
    }
  } catch (error) {
    console.error('Failed to load aws-exports.js:', error);
    console.error('Please run "amplify push" to generate the configuration file');
    return false;
  }
};

// Amplifyの設定を実行
const isConfigured = configureAmplify();

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        {isConfigured ? (
          <ThemeProvider>
            <ThemeSwitcher />
            <Authenticator.Provider>
              {children}
            </Authenticator.Provider>
          </ThemeProvider>
        ) : (
          <div className="error-container">
            <h2>設定エラー</h2>
            <p>AWS Amplifyの設定が見つかりません。</p>
            <p>以下のコマンドを実行してください：</p>
            <code className="error-code">
              amplify push
            </code>
            {children}
          </div>
        )}
      </body>
    </html>
  );
}
