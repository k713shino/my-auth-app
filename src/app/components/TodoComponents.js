'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { createTodo, updateTodo, deleteTodo } from '../../graphql/mutations';
import { listTodos } from '../../graphql/queries';
import { onCreateTodo, onUpdateTodo, onDeleteTodo } from '../../graphql/subscriptions';
import { format, isAfter } from 'date-fns';

// 認証付きクライアントを作成
const client = generateClient({
  authMode: 'userPool'
});

// TodoFormコンポーネント
const TodoForm = ({ onSubmit, editingTodo, onCancel, loading }) => {
  // 編集時の日時フォーマットを修正
  const getFormattedDateTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // datetime-local input用の形式に変換 (YYYY-MM-DDTHH:mm)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('日時フォーマットエラー:', error);
      return '';
    }
  };

  // 初期フォームデータの設定
  const getInitialFormData = (todo) => ({
    title: todo?.title || '',
    description: todo?.description || '',
    priority: todo?.priority || 'MEDIUM',
    dueDate: getFormattedDateTime(todo?.dueDate),
  });

  const [formData, setFormData] = useState(getInitialFormData(editingTodo));

  // 編集対象が変更されたときにフォームデータを更新
  useEffect(() => {
    console.log('編集対象が変更されました:', editingTodo);
    setFormData(getInitialFormData(editingTodo));
  }, [editingTodo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('タイトルを入力してください！');
      return;
    }
    
    console.log('フォーム送信データ:', formData);
    
    onSubmit({
      ...formData,
      dueDate: formData.dueDate || null,
    });
    
    // 新規作成の場合のみフォームをリセット
    if (!editingTodo) {
      setFormData(getInitialFormData(null));
    }
  };

  const handleCancel = () => {
    console.log('編集キャンセル');
    setFormData(getInitialFormData(null)); // フォームをリセット
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h3>{editingTodo ? `「${editingTodo.title}」を編集` : '新しいTodoを作成'}</h3>
      
      <div className="input-group">
        <label className="label">タイトル*</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={`input ${!formData.title.trim() ? 'input-error' : ''}`}
          placeholder="タイトルを入力してください"
          required
          disabled={loading}
        />
        {!formData.title.trim() && (
          <small className="error-text">
            ※ タイトルは必須項目です
          </small>
        )}
      </div>
      
      <div className="input-group">
        <label className="label">詳細</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="textarea"
          placeholder="詳細を入力してください（任意）"
          disabled={loading}
        />
      </div>
      
      <div className="form-row">
        <div className="input-group flex-1">
          <label className="label">優先度</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="select"
            disabled={loading}
          >
            <option value="LOW">低</option>
            <option value="MEDIUM">中</option>
            <option value="HIGH">高</option>
            <option value="URGENT">緊急</option>
          </select>
        </div>
        
        <div className="input-group flex-1">
          <label className="label">期限</label>
          <input
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="input"
            disabled={loading}
          />
          {formData.dueDate && (
            <small className="help-text">
              設定された期限: {new Date(formData.dueDate).toLocaleString('ja-JP')}
            </small>
          )}
        </div>
      </div>
      
      <div className="button-group">
        <button
          type="submit"
          className={`button button-primary ${!formData.title.trim() ? 'button-disabled' : ''}`}
          disabled={loading || !formData.title.trim()}
        >
          {loading ? (editingTodo ? '更新中...' : '作成中...') : (editingTodo ? '更新' : '作成')}
        </button>
        
        {editingTodo && (
          <button
            type="button"
            onClick={handleCancel}
            className="button button-secondary"
            disabled={loading}
          >
            キャンセル
          </button>
        )}
        
        {!editingTodo && formData.title && (
          <button
            type="button"
            onClick={() => setFormData(getInitialFormData(null))}
            className="button button-secondary"
            disabled={loading}
          >
            リセット
          </button>
        )}
      </div>
      
      {/* デバッグ情報（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <strong>デバッグ情報:</strong><br />
          編集モード: {editingTodo ? 'あり' : 'なし'}<br />
          編集ID: {editingTodo?.id || 'なし'}<br />
          フォームタイトル: {formData.title}<br />
          フォーム期限: {formData.dueDate || 'なし'}
        </div>
      )}
    </form>
  );
};

// TodoItemコンポーネント
const TodoItem = ({ todo, onToggle, onEdit, onDelete, loading }) => {
  const isOverdue = todo.dueDate && !todo.completed && isAfter(new Date(), new Date(todo.dueDate));
  
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'LOW': return 'priority-low';
      case 'MEDIUM': return 'priority-medium';
      case 'HIGH': return 'priority-high';
      case 'URGENT': return 'priority-urgent';
      default: return 'priority-medium';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'LOW': return '低';
      case 'MEDIUM': return '中';
      case 'HIGH': return '高';
      case 'URGENT': return '緊急';
    }
  };

  // 編集ボタンクリック時の処理を強化
  const handleEditClick = () => {
    console.log('編集開始 - Todo:', todo);
    onEdit(todo);
  };

  const handleDeleteClick = () => {
    if (confirm(`「${todo.title}」を削除してもよろしいですか？`)) {
      onDelete(todo);
    }
  };

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div className="todo-header">
        <div className="todo-header-left">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo)}
            className="checkbox"
            disabled={loading}
          />
          <h4 className="todo-title">{todo.title}</h4>
        </div>
        <div className="button-group">
          <button
            onClick={handleEditClick}
            className={`button button-primary button-sm ${loading ? 'button-disabled' : ''}`}
            disabled={loading}
            title={`「${todo.title}」を編集`}
          >
            編集
          </button>
          <button
            onClick={handleDeleteClick}
            className={`button button-danger button-sm ${loading ? 'button-disabled' : ''}`}
            disabled={loading}
            title={`「${todo.title}」を削除`}
          >
            削除
          </button>
        </div>
      </div>
      
      {todo.description && (
        <p className="todo-description">
          {todo.description}
        </p>
      )}
      
      <div className="todo-meta">
        <span className={`priority ${getPriorityClass(todo.priority)}`}>
          {getPriorityLabel(todo.priority)}
        </span>
        {todo.dueDate && (
          <span className={isOverdue ? 'text-danger' : ''}>
            期限: {format(new Date(todo.dueDate), 'yyyy/MM/dd HH:mm')}
            {isOverdue && ' (期限切れ)'}
          </span>
        )}
        <span>作成: {format(new Date(todo.createdAt), 'yyyy/MM/dd HH:mm')}</span>
      </div>
    </div>
  );
};

// TodoApp メインコンポーネント
export const TodoApp = ({ user }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  // 初回読み込み
  useEffect(() => {
    fetchTodos();
    const subscriptions = setupSubscriptions();
    
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  // メッセージ表示
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Todo一覧取得
  const fetchTodos = async () => {
    try {
      const result = await client.graphql({
        query: listTodos,
        authMode: 'userPool'
      });
      
      const todoList = result.data.listTodos.items
        .filter(item => !item._deleted)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setTodos(todoList);
    } catch (error) {
      console.error('Todo取得エラー:', error);
      showMessage('error', 'Todoの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // リアルタイム更新の設定
  const setupSubscriptions = () => {
    const subscriptions = [];

    // Todo作成の監視
    const createSub = client.graphql({
      query: onCreateTodo,
      authMode: 'userPool'
    }).subscribe({
      next: ({ data }) => {
        const newTodo = data.onCreateTodo;
        setTodos(prev => [newTodo, ...prev.filter(t => t.id !== newTodo.id)]);
      },
      error: (err) => console.error('Create subscription error:', err)
    });
    subscriptions.push(createSub);

    // Todo更新の監視
    const updateSub = client.graphql({
      query: onUpdateTodo,
      authMode: 'userPool'
    }).subscribe({
      next: ({ data }) => {
        const updatedTodo = data.onUpdateTodo;
        setTodos(prev => prev.map(t => t.id === updatedTodo.id ? updatedTodo : t));
      },
      error: (err) => console.error('Update subscription error:', err)
    });
    subscriptions.push(updateSub);

    // Todo削除の監視
    const deleteSub = client.graphql({
      query: onDeleteTodo,
      authMode: 'userPool'
    }).subscribe({
      next: ({ data }) => {
        const deletedTodo = data.onDeleteTodo;
        setTodos(prev => prev.filter(t => t.id !== deletedTodo.id));
      },
      error: (err) => console.error('Delete subscription error:', err)
    });
    subscriptions.push(deleteSub);

    return subscriptions;
  };

  // Todo作成・更新
  const handleSubmitTodo = async (todoData) => {
    setOperationLoading(true);
    
    console.log('=== Todo保存開始 ===');
    console.log('入力データ:', todoData);
    
    try {
      // 現在のユーザー確認
      const currentUser = await getCurrentUser();
      console.log('現在のユーザー:', {
        username: currentUser.username,
        userId: currentUser.userId,
        signInDetails: currentUser.signInDetails
      });

      // 日時の正しいフォーマット処理
      let formattedDueDate = null;
      if (todoData.dueDate) {
        // datetime-localの値を正しいISO 8601形式に変換
        const date = new Date(todoData.dueDate);
        if (!isNaN(date.getTime())) {
          // ISO 8601形式で出力（例: 2025-07-03T10:54:00.000Z）
          formattedDueDate = date.toISOString();
        }
      }
      
      console.log('元の日時:', todoData.dueDate);
      console.log('変換後の日時:', formattedDueDate);

      const input = {
        title: todoData.title,
        description: todoData.description || '',
        priority: todoData.priority || 'MEDIUM',
        dueDate: formattedDueDate,  // 修正：正しくフォーマットされた日時
        completed: false,
      };
      
      console.log('GraphQLに送信する入力データ:', input);
      
      // GraphQLクライアントの設定確認
      console.log('GraphQLクライアント設定:', {
        authMode: 'userPool',
        clientExists: !!client
      });
      
      if (editingTodo) {
        console.log('Todo更新モード - 更新対象ID:', editingTodo.id);
        
        const updateInput = { 
          id: editingTodo.id, 
          ...input, 
          completed: editingTodo.completed 
        };
        console.log('更新用入力データ:', updateInput);
        
        const result = await client.graphql({
          query: updateTodo,
          variables: { input: updateInput },
          authMode: 'userPool'
        });
        
        console.log('更新成功:', result);
        setEditingTodo(null);
        showMessage('success', 'Todoが更新されました');
        
      } else {
        console.log('Todo作成モード');
        
        const result = await client.graphql({
          query: createTodo,
          variables: { input },
          authMode: 'userPool'
        });
        
        console.log('作成成功:', result);
        console.log('作成されたTodo:', result.data?.createTodo);
        showMessage('success', 'Todoが作成されました');
      }
      
      console.log('=== Todo保存完了 ===');
      
    } catch (error) {
      console.log('=== エラー詳細分析 ===');
      console.error('エラーオブジェクト:', error);
      
      // GraphQLエラーの確認
      if (error.errors) {
        console.error('GraphQLエラー一覧:', error.errors);
        error.errors.forEach((err, index) => {
          console.error(`GraphQLエラー ${index + 1}:`, {
            message: err.message,
            locations: err.locations,
            path: err.path
          });
        });
      }
      
      // ユーザーフレンドリーなエラーメッセージ
      let userMessage = 'Todoの保存に失敗しました';
      
      if (error.errors && error.errors[0]) {
        const firstError = error.errors[0];
        if (firstError.message.includes('dueDate')) {
          userMessage = '期限の日時形式に問題があります。正しい日時を入力してください。';
        } else if (firstError.message.includes('UnauthorizedException')) {
          userMessage = 'ログインが必要です。再度ログインしてください。';
        } else if (firstError.message.includes('ValidationException')) {
          userMessage = '入力データに問題があります。';
        } else {
          userMessage = `エラー: ${firstError.message}`;
        }
      }
      
      showMessage('error', userMessage);
      console.log('=== エラー分析完了 ===');
      
    } finally {
      setOperationLoading(false);
    }
  };

  // Todo完了状態切り替え
  const handleToggleTodo = async (todo) => {
    setOperationLoading(true);
    try {
      await client.graphql({
        query: updateTodo,
        variables: {
          input: {
            id: todo.id,
            completed: !todo.completed
          }
        },
        authMode: 'userPool'
      });
      showMessage('success', todo.completed ? '未完了にしました' : '完了しました');
    } catch (error) {
      console.error('Todo更新エラー:', error);
      showMessage('error', 'Todoの更新に失敗しました');
    } finally {
      setOperationLoading(false);
    }
  };

  // Todo削除
  const handleDeleteTodo = async (todo) => {
    if (!confirm('このTodoを削除しますか？')) return;
    
    setOperationLoading(true);
    try {
      await client.graphql({
        query: deleteTodo,
        variables: {
          input: { id: todo.id }
        },
        authMode: 'userPool'
      });
      showMessage('success', 'Todoが削除されました');
    } catch (error) {
      console.error('Todo削除エラー:', error);
      showMessage('error', 'Todoの削除に失敗しました');
    } finally {
      setOperationLoading(false);
    }
  };

  // フィルタリング
  const filteredTodos = todos.filter(todo => {
    if (filter === 'completed') return todo.completed;
    if (filter === 'active') return !todo.completed;
    return true;
  });

  // 統計情報
  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
    overdue: todos.filter(t => 
      t.dueDate && !t.completed && isAfter(new Date(), new Date(t.dueDate))
    ).length,
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>{user.username}さんのTodoリスト</h1>
      </div>

      {/* メッセージ表示 */}
      {message.text && (
        <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
          {message.text}
        </div>
      )}

      {/* 統計情報 */}
      <div className="stats">
        <div className="stat-item">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">全て</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">未完了</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.completed}</div>
          <div className="stat-label">完了</div>
        </div>
        <div className="stat-item">
          <div className={`stat-number ${stats.overdue > 0 ? 'text-danger' : ''}`}>
            {stats.overdue}
          </div>
          <div className="stat-label">期限切れ</div>
        </div>
      </div>

      {/* Todoフォーム */}
      <TodoForm
        onSubmit={handleSubmitTodo}
        editingTodo={editingTodo}
        onCancel={() => setEditingTodo(null)}
        loading={operationLoading}
      />

      {/* フィルタ */}
      <div className="filter-container">
        <button
          onClick={() => setFilter('all')}
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
        >
          すべて ({stats.total})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`filter-button ${filter === 'active' ? 'active' : ''}`}
        >
          未完了 ({stats.active})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`filter-button ${filter === 'completed' ? 'active' : ''}`}
        >
          完了済み ({stats.completed})
        </button>
      </div>

      {/* Todoリスト */}
      {filteredTodos.length > 0 ? (
        <div className="todo-list">
          {filteredTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggleTodo}
              onEdit={setEditingTodo}
              onDelete={handleDeleteTodo}
              loading={operationLoading}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          {filter === 'all' ? 'Todoがありません' : 
           filter === 'active' ? '未完了のTodoがありません' : 
           '完了したTodoがありません'}
        </div>
      )}
    </div>
  );
};
