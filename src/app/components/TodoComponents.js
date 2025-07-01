'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { createTodo, updateTodo, deleteTodo } from '../../graphql/mutations';
import { listTodos } from '../../graphql/queries';
import { onCreateTodo, onUpdateTodo, onDeleteTodo } from '../../graphql/subscriptions';

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
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333',
  },
  todoForm: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    marginRight: '10px',
    transition: 'background-color 0.2s ease',
  },
  buttonDanger: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  buttonSuccess: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    marginRight: '10px',
    transition: 'background-color 0.2s ease',
  },
  todoList: {
    listStyle: 'none',
    padding: 0,
  },
  todoItem: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  todoItemCompleted: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  todoTitle: {
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '5px',
  },
  todoTitleCompleted: {
    textDecoration: 'line-through',
    color: '#666',
  },
  todoMeta: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
  },
  priorityBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    marginLeft: '10px',
  },
  loadingSpinner: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '16px',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    backgroundColor: '#e9ecef',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  statItem: {
    textAlign: 'center',
    minWidth: '80px',
    margin: '5px',
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
  filterContainer: {
    marginBottom: '20px',
  },
  errorMessage: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    padding: '10px',
    marginBottom: '15px',
  },
  successMessage: {
    color: '#155724',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
    padding: '10px',
    marginBottom: '15px',
  },
};

// 優先度の色設定
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'URGENT': return { backgroundColor: '#dc3545', color: 'white' };
    case 'HIGH': return { backgroundColor: '#fd7e14', color: 'white' };
    case 'MEDIUM': return { backgroundColor: '#ffc107', color: 'black' };
    case 'LOW': return { backgroundColor: '#28a745', color: 'white' };
    default: return { backgroundColor: '#6c757d', color: 'white' };
  }
};

// 優先度の日本語表示
const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'URGENT': return '緊急';
    case 'HIGH': return '高';
    case 'MEDIUM': return '中';
    case 'LOW': return '低';
    default: return '未設定';
  }
};

// Todoフォームコンポーネント
const TodoForm = ({ onSubmit, editingTodo, onCancelEdit, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
  });

  useEffect(() => {
    if (editingTodo) {
      setFormData({
        title: editingTodo.title || '',
        description: editingTodo.description || '',
        priority: editingTodo.priority || 'MEDIUM',
        dueDate: editingTodo.dueDate ? editingTodo.dueDate.split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
      });
    }
  }, [editingTodo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const todoData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
    };

    onSubmit(todoData);
    
    if (!editingTodo) {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={STYLES.todoForm}>
      <h3>{editingTodo ? 'Todoを編集' : '新しいTodoを作成'}</h3>
      
      <div style={STYLES.formGroup}>
        <label style={STYLES.label}>タイトル *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Todoのタイトルを入力してください"
          style={STYLES.input}
          required
          disabled={loading}
        />
      </div>

      <div style={STYLES.formGroup}>
        <label style={STYLES.label}>説明</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="詳細な説明（オプション）"
          style={STYLES.textarea}
          disabled={loading}
        />
      </div>

      <div style={STYLES.formGroup}>
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

      <div style={STYLES.formGroup}>
        <label style={STYLES.label}>期限</label>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          style={STYLES.input}
          disabled={loading}
        />
      </div>

      <div>
        <button 
          type="submit" 
          style={STYLES.button}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#0056b3')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#007bff')}
        >
          {loading ? '処理中...' : (editingTodo ? 'Todo を更新' : 'Todo を作成')}
        </button>
        {editingTodo && (
          <button 
            type="button" 
            onClick={onCancelEdit} 
            style={STYLES.buttonDanger}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#c82333')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#dc3545')}
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};

// Todoアイテムコンポーネント
const TodoItem = ({ todo, onToggleComplete, onEdit, onDelete, loading }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  return (
    <li 
      style={{
        ...STYLES.todoItem,
        ...(todo.completed ? STYLES.todoItemCompleted : {}),
        ...(isOverdue ? { borderLeft: '4px solid #dc3545' } : {})
      }}
    >
      <div style={{
        ...STYLES.todoTitle,
        ...(todo.completed ? STYLES.todoTitleCompleted : {})
      }}>
        {todo.title}
        <span style={{ ...STYLES.priorityBadge, ...getPriorityColor(todo.priority) }}>
          {getPriorityLabel(todo.priority)}
        </span>
        {isOverdue && (
          <span style={{ color: '#dc3545', marginLeft: '10px', fontSize: '14px' }}>
            期限切れ
          </span>
        )}
      </div>
      
      {todo.description && (
        <p style={{ marginBottom: '10px', color: '#666' }}>{todo.description}</p>
      )}
      
      <div style={STYLES.todoMeta}>
        作成日: {formatDate(todo.createdAt)}
        {todo.dueDate && ` | 期限: ${formatDate(todo.dueDate)}`}
      </div>
      
      <div>
        <button
          onClick={() => onToggleComplete(todo)}
          style={todo.completed ? STYLES.button : STYLES.buttonSuccess}
          disabled={loading}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = todo.completed ? '#0056b3' : '#218838';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = todo.completed ? '#007bff' : '#28a745';
            }
          }}
        >
          {todo.completed ? '未完了にする' : '完了にする'}
        </button>
        <button 
          onClick={() => onEdit(todo)} 
          style={STYLES.button}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#0056b3')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#007bff')}
        >
          編集
        </button>
        <button 
          onClick={() => onDelete(todo)} 
          style={STYLES.buttonDanger}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#c82333')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#dc3545')}
        >
          削除
        </button>
      </div>
    </li>
  );
};

// 統計表示コンポーネント
const TodoStats = ({ todos }) => {
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const pendingTodos = totalTodos - completedTodos;
  const overdueTodos = todos.filter(todo => 
    todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed
  ).length;

  return (
    <div style={STYLES.stats}>
      <div style={STYLES.statItem}>
        <div style={STYLES.statNumber}>{totalTodos}</div>
        <div style={STYLES.statLabel}>総Todo数</div>
      </div>
      <div style={STYLES.statItem}>
        <div style={STYLES.statNumber}>{pendingTodos}</div>
        <div style={STYLES.statLabel}>未完了</div>
      </div>
      <div style={STYLES.statItem}>
        <div style={STYLES.statNumber}>{completedTodos}</div>
        <div style={STYLES.statLabel}>完了済み</div>
      </div>
      <div style={STYLES.statItem}>
        <div style={{ ...STYLES.statNumber, color: overdueTodos > 0 ? '#dc3545' : '#007bff' }}>
          {overdueTodos}
        </div>
        <div style={STYLES.statLabel}>期限切れ</div>
      </div>
    </div>
  );
};

// メインのTodoアプリコンポーネント
export const TodoApp = ({ user }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  // メッセージを表示する関数
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Todoの読み込み
  const fetchTodos = async () => {
    try {
      const result = await client.graphql({
        query: listTodos,
        authMode: 'userPool'
      });
      setTodos(result.data.listTodos.items || []);
    } catch (error) {
      console.error('Todoの取得に失敗しました:', error);
      showMessage('error', 'Todoの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初期化とサブスクリプション
  useEffect(() => {
    console.log('TodoApp initialized for user:', user?.username);
    fetchTodos();

    // リアルタイム更新のサブスクリプション
    const createSub = client.graphql({
      query: onCreateTodo,
      authMode: 'userPool'
    }).subscribe({
      next: ({ data }) => {
        console.log('New todo created:', data.onCreateTodo);
        const newTodo = data.onCreateTodo;
        setTodos(prev => [newTodo, ...prev]);
        showMessage('success', 'Todoが作成されました');
      },
      error: (error) => {
        console.error('Create subscription error:', error);
      }
    });

    const updateSub = client.graphql({
      query: onUpdateTodo,
      authMode: 'userPool'
    }).subscribe({
      next: ({ data }) => {
        console.log('Todo updated:', data.onUpdateTodo);
        const updatedTodo = data.onUpdateTodo;
        setTodos(prev => prev.map(todo => 
          todo.id === updatedTodo.id ? updatedTodo : todo
        ));
      },
      error: (error) => console.error('Update subscription error:', error)
    });

    const deleteSub = client.graphql({
      query: onDeleteTodo,
      authMode: 'userPool'
    }).subscribe({
      next: ({ data }) => {
        console.log('Todo deleted:', data.onDeleteTodo);
        const deletedTodo = data.onDeleteTodo;
        setTodos(prev => prev.filter(todo => todo.id !== deletedTodo.id));
        showMessage('success', 'Todoが削除されました');
      },
      error: (error) => console.error('Delete subscription error:', error)
    });

    return () => {
      createSub.unsubscribe();
      updateSub.unsubscribe();
      deleteSub.unsubscribe();
    };
  }, [user?.username]);

  // Todo作成・更新
  const handleSubmitTodo = async (todoData) => {
    setOperationLoading(true);
    
    // 認証状態をデバッグ
    console.log('Current user:', user);
    console.log('User attributes:', user?.username, user?.userId);
    
    try {
      const input = {
        title: todoData.title,
        description: todoData.description || '',
        priority: todoData.priority || 'MEDIUM',
        dueDate: todoData.dueDate || null,
        completed: false,
      };
      
      console.log('Creating todo with input:', input);
      
      if (editingTodo) {
        const result = await client.graphql({
          query: updateTodo,
          variables: {
            input: {
              id: editingTodo.id,
              ...input,
              completed: editingTodo.completed,
            }
          },
          authMode: 'userPool'
        });
        console.log('Update result:', result);
        setEditingTodo(null);
        showMessage('success', 'Todoが更新されました');
      } else {
        const result = await client.graphql({
          query: createTodo,
          variables: { input },
          authMode: 'userPool'
        });
        console.log('Create result:', result);
        showMessage('success', 'Todoが作成されました');
      }
    } catch (error) {
      console.error('GraphQL Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // より詳細なエラーメッセージ
      let errorMessage = 'Todoの保存に失敗しました';
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0];
        if (firstError.errorType === 'Unauthorized') {
          errorMessage = '認証エラー: Todoを作成する権限がありません。ログインし直してください。';
        } else {
          errorMessage += ': ' + firstError.message;
        }
      }
      showMessage('error', errorMessage);
    } finally {
      setOperationLoading(false);
    }
  };

  // Todo完了状態切り替え
  const handleToggleComplete = async (todo) => {
    setOperationLoading(true);
    try {
      await client.graphql({
        query: updateTodo,
        variables: {
          input: {
            id: todo.id,
            completed: !todo.completed,
          }
        },
        authMode: 'userPool'
      });
      showMessage('success', `Todoを${!todo.completed ? '完了' : '未完了'}にしました`);
    } catch (error) {
      console.error('Todoの更新に失敗しました:', error);
      showMessage('error', 'Todoの更新に失敗しました');
    } finally {
      setOperationLoading(false);
    }
  };

  // Todo削除
  const handleDeleteTodo = async (todo) => {
    if (!window.confirm('このTodoを削除しますか？')) return;

    setOperationLoading(true);
    try {
      await client.graphql({
        query: deleteTodo,
        variables: {
          input: { id: todo.id }
        },
        authMode: 'userPool'
      });
    } catch (error) {
      console.error('Todoの削除に失敗しました:', error);
      showMessage('error', 'Todoの削除に失敗しました');
    } finally {
      setOperationLoading(false);
    }
  };

  // フィルタリング
  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'pending': return !todo.completed;
      case 'completed': return todo.completed;
      default: return true;
    }
  });

  if (loading) {
    return <div style={STYLES.loadingSpinner}>Todoを読み込み中...</div>;
  }

  return (
    <div style={STYLES.container}>
      <div style={STYLES.header}>
        <h1>{user.username}さんのTodoリスト</h1>
      </div>

      {/* メッセージ表示 */}
      {message.text && (
        <div style={message.type === 'error' ? STYLES.errorMessage : STYLES.successMessage}>
          {message.text}
        </div>
      )}

      <TodoStats todos={todos} />

      <TodoForm
        onSubmit={handleSubmitTodo}
        editingTodo={editingTodo}
        onCancelEdit={() => setEditingTodo(null)}
        loading={operationLoading}
      />

      <div style={STYLES.filterContainer}>
        <label style={STYLES.label}>フィルター: </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{...STYLES.select, width: 'auto', display: 'inline-block', marginLeft: '10px'}}
        >
          <option value="all">すべて ({todos.length})</option>
          <option value="pending">未完了 ({todos.filter(t => !t.completed).length})</option>
          <option value="completed">完了済み ({todos.filter(t => t.completed).length})</option>
        </select>
      </div>

      {filteredTodos.length === 0 ? (
        <div style={STYLES.emptyState}>
          <h3>
            {filter === 'all' && 'Todoがありません'}
            {filter === 'pending' && '未完了のTodoがありません'}
            {filter === 'completed' && '完了済みのTodoがありません'}
          </h3>
          <p>新しいTodoを作成してみましょう！</p>
        </div>
      ) : (
        <ul style={STYLES.todoList}>
          {filteredTodos
            .sort((a, b) => {
              // 完了状態でソート（未完了を上に）
              if (a.completed !== b.completed) {
                return a.completed - b.completed;
              }
              // 作成日でソート（新しいものを上に）
              return new Date(b.createdAt) - new Date(a.createdAt);
            })
            .map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggleComplete={handleToggleComplete}
                onEdit={setEditingTodo}
                onDelete={handleDeleteTodo}
                loading={operationLoading}
              />
            ))}
        </ul>
      )}
    </div>
  );
};