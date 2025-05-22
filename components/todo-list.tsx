"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Edit, X, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type Todo = {
  id: string
  text: string
  completed: boolean
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  // Load todos from localStorage on initial render
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos")
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos))
    }
  }, [])

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (newTodo.trim() !== "") {
      const newTodoItem: Todo = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
      }
      setTodos([...todos, newTodoItem])
      setNewTodo("")
    }
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  const saveEdit = () => {
    if (editText.trim() !== "" && editingId) {
      setTodos(todos.map((todo) => (todo.id === editingId ? { ...todo, text: editText.trim() } : todo)))
      setEditingId(null)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed
    if (filter === "completed") return todo.completed
    return true
  })

  const activeTodosCount = todos.filter((todo) => !todo.completed).length

  return (
    <div className="bg-white dark:bg-slate-950 rounded-lg shadow-lg p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">To-Do List</h1>

      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTodo()
          }}
          className="flex-1"
        />
        <Button onClick={addTodo} size="icon">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add task</span>
        </Button>
      </div>

      <Tabs defaultValue="all" value={filter} onValueChange={(value) => setFilter(value as any)}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <TodoItems
            todos={filteredTodos}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
            startEditing={startEditing}
            editingId={editingId}
            editText={editText}
            setEditText={setEditText}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
          />
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          <TodoItems
            todos={filteredTodos}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
            startEditing={startEditing}
            editingId={editingId}
            editText={editText}
            setEditText={setEditText}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <TodoItems
            todos={filteredTodos}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
            startEditing={startEditing}
            editingId={editingId}
            editText={editText}
            setEditText={setEditText}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
          />
        </TabsContent>
      </Tabs>

      <div className="text-sm text-muted-foreground">
        {activeTodosCount} {activeTodosCount === 1 ? "task" : "tasks"} remaining
      </div>
    </div>
  )
}

type TodoItemsProps = {
  todos: Todo[]
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  startEditing: (todo: Todo) => void
  editingId: string | null
  editText: string
  setEditText: (text: string) => void
  saveEdit: () => void
  cancelEdit: () => void
}

function TodoItems({
  todos,
  toggleTodo,
  deleteTodo,
  startEditing,
  editingId,
  editText,
  setEditText,
  saveEdit,
  cancelEdit,
}: TodoItemsProps) {
  if (todos.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No tasks found</p>
  }

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className={cn(
            "flex items-center justify-between p-3 rounded-md border",
            todo.completed ? "bg-muted/50" : "bg-background",
          )}
        >
          {editingId === todo.id ? (
            <div className="flex items-center space-x-2 flex-1">
              <Input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit()
                  if (e.key === "Escape") cancelEdit()
                }}
                autoFocus
                className="flex-1"
              />
              <Button size="icon" variant="ghost" onClick={saveEdit}>
                <Save className="h-4 w-4" />
                <span className="sr-only">Save</span>
              </Button>
              <Button size="icon" variant="ghost" onClick={cancelEdit}>
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel</span>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2 flex-1">
                <Checkbox id={`todo-${todo.id}`} checked={todo.completed} onCheckedChange={() => toggleTodo(todo.id)} />
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={cn("flex-1 cursor-pointer", todo.completed && "line-through text-muted-foreground")}
                >
                  {todo.text}
                </label>
              </div>
              <div className="flex items-center space-x-1">
                <Button size="icon" variant="ghost" onClick={() => startEditing(todo)} disabled={todo.completed}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteTodo(todo.id)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
