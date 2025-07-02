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

// スタイル定数
const STYLES = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center',
  },
  form: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '80px',
  },
  select: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    outline: 'none',
    cursor: 'pointer',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    color: 'white',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
    color: 'white',
  },
  successButton: {
    backgroundColor: '#28a745',
    color: 'white',
  },
  filterContainer: {
    marginBottom: '20px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '8px 16px',
    fontSize: '14px',
    border: '1px solid #007bff',
    borderRadius: '5px',
    backgroundColor: 'white',
    color: '#007bff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeFilter: {
    backgroundColor: '#007bff',
    color: 'white',
  },
  todoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  todoItem: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  todoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  todoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  todoMeta: {
    display: 'flex',
    gap: '15px',
    marginBottom: '10px',
    fontSize: '14px',
    color: '#666',
  },
  priority: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  priorityLow: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  priorityMedium: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  priorityHigh: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  priorityUrgent: {
    backgroundColor: '#d1ecf1',
    color: '#0c5460',
  },
  completed: {
    opacity: 0.6,
    textDecoration: 'line-through',
  },
  overdue: {
    borderLeft: '4px solid #dc3545',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    marginRight: '10px',
    cursor: 'pointer',
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
  },
  message: {
    padding: '15px',
    marginBottom: '20px',
    borderRadius: '5px',
    textAlign: 'center',
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '18px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  },
};

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

  const [formData, setFormData] = useState({
    title: editingTodo?.title || '',
    description: editingTodo?.description || '',
    priority: editingTodo?.priority || 'MEDIUM',
    dueDate: getFormattedDateTime(editingTodo?.dueDate), // 修正：正しい形式で初期化
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onSubmit({
      ...formData,
      dueDate: formData.dueDate || null,
    });
    
    if (!editingTodo) {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
      });
    }
  };

  // 残りのJSXは変更なし
  return (
    <form onSubmit={handleSubmit} style={STYLES.form}>
      <h3>{editingTodo ? 'Todoを編集' : '新しいTodoを作成'}</h3>
      
      <div style={STYLES.inputGroup}>
        <label style={STYLES.label}>タイトル*</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          style={STYLES.input}
          placeholder="タイトルを入力"
          required
          disabled={loading}
        />
      </div>
      
      <div style={STYLES.inputGroup}>
        <label style={STYLES.label}>詳細</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          style={STYLES.textarea}
          placeholder="詳細を入力（任意）"
          disabled={loading}
        />
      </div>
      
      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{ ...STYLES.inputGroup, flex: 1 }}>
          <label style={STYLES.label}>優先度</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            style={STYLES.select}
            disabled={loading}
          >
            <option value="LOW">低</option>
            <option value="MEDIUM">中</option>
            <option value="HIGH">高</option>
            <option value="URGENT">緊急</option>
          </select>
        </div>
        
        <div style={{ ...STYLES.inputGroup, flex: 1 }}>
          <label style={STYLES.label}>期限</label>
          <input
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            style={STYLES.input}
            disabled={loading}
          />
        </div>
      </div>
      
      <div style={STYLES.buttonGroup}>
        <button
          type="submit"
          style={{ ...STYLES.button, ...STYLES.primaryButton }}
          disabled={loading || !formData.title.trim()}
        >
          {loading ? '保存中...' : editingTodo ? '更新' : '作成'}
        </button>
        {editingTodo && (
          <button
            type="button"
            onClick={onCancel}
            style={{ ...STYLES.button, ...STYLES.secondaryButton }}
            disabled={loading}
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};

// TodoItemコンポーネント
const TodoItem = ({ todo, onToggle, onEdit, onDelete, loading }) => {
  const isOverdue = todo.dueDate && !todo.completed && isAfter(new Date(), new Date(todo.dueDate));
  
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'LOW': return STYLES.priorityLow;
      case 'MEDIUM': return STYLES.priorityMedium;
      case 'HIGH': return STYLES.priorityHigh;
      case 'URGENT': return STYLES.priorityUrgent;
      default: return STYLES.priorityMedium;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'LOW': return '低';
      case 'MEDIUM': return '中';
      case 'HIGH': return '高';
      case 'URGENT': return '緊急';
      default: return '中';
    }
  };

  return (
    <div
      style={{
        ...STYLES.todoItem,
        ...(todo.completed ? STYLES.completed : {}),
        ...(isOverdue ? STYLES.overdue : {}),
      }}
    >
      <div style={STYLES.todoHeader}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo)}
            style={STYLES.checkbox}
            disabled={loading}
          />
          <h4 style={STYLES.todoTitle}>{todo.title}</h4>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onEdit(todo)}
            style={{ ...STYLES.button, ...STYLES.primaryButton, padding: '6px 12px', fontSize: '14px' }}
            disabled={loading}
          >
            編集
          </button>
          <button
            onClick={() => onDelete(todo)}
            style={{ ...STYLES.button, ...STYLES.dangerButton, padding: '6px 12px', fontSize: '14px' }}
            disabled={loading}
          >
            削除
          </button>
        </div>
      </div>
      
      {todo.description && (
        <p style={{ marginBottom: '10px', color: '#666' }}>{todo.description}</p>
      )}
      
      <div style={STYLES.todoMeta}>
        <span style={{ ...STYLES.priority, ...getPriorityStyle(todo.priority) }}>
          {getPriorityLabel(todo.priority)}
        </span>
        {todo.dueDate && (
          <span style={{ color: isOverdue ? '#dc3545' : '#666' }}>
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
    return <div style={STYLES.loading}>読み込み中...</div>;
  }

  return (
    <div style={STYLES.container}>
      <div style={STYLES.header}>
        <h1>{user.username}さんのTodoリスト</h1>
      </div>

      {/* メッセージ表示 */}
      {message.text && (
        <div style={{
          ...STYLES.message,
          ...(message.type === 'success' ? STYLES.successMessage : STYLES.errorMessage)
        }}>
          {message.text}
        </div>
      )}

      {/* 統計情報 */}
      <div style={STYLES.stats}>
        <div style={STYLES.statItem}>
          <div style={STYLES.statNumber}>{stats.total}</div>
          <div style={STYLES.statLabel}>全て</div>
        </div>
        <div style={STYLES.statItem}>
          <div style={STYLES.statNumber}>{stats.active}</div>
          <div style={STYLES.statLabel}>未完了</div>
        </div>
        <div style={STYLES.statItem}>
          <div style={STYLES.statNumber}>{stats.completed}</div>
          <div style={STYLES.statLabel}>完了</div>
        </div>
        <div style={STYLES.statItem}>
          <div style={{ ...STYLES.statNumber, color: stats.overdue > 0 ? '#dc3545' : '#007bff' }}>
            {stats.overdue}
          </div>
          <div style={STYLES.statLabel}>期限切れ</div>
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
      <div style={STYLES.filterContainer}>
        <button
          onClick={() => setFilter('all')}
          style={{
            ...STYLES.filterButton,
            ...(filter === 'all' ? STYLES.activeFilter : {})
          }}
        >
          すべて ({stats.total})
        </button>
        <button
          onClick={() => setFilter('active')}
          style={{
            ...STYLES.filterButton,
            ...(filter === 'active' ? STYLES.activeFilter : {})
          }}
        >
          未完了 ({stats.active})
        </button>
        <button
          onClick={() => setFilter('completed')}
          style={{
            ...STYLES.filterButton,
            ...(filter === 'completed' ? STYLES.activeFilter : {})
          }}
        >
          完了済み ({stats.completed})
        </button>
      </div>

      {/* Todoリスト */}
      {filteredTodos.length > 0 ? (
        <div style={STYLES.todoList}>
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
        <div style={STYLES.empty}>
          {filter === 'all' ? 'Todoがありません' : 
           filter === 'active' ? '未完了のTodoがありません' : 
           '完了したTodoがありません'}
        </div>
      )}
    </div>
  );
};
