"use client"

import { useState, useEffect } from "react"
import { Plus, Filter } from "lucide-react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

type TaskStatus = "Pending" | "In Progress" | "Completed"

type Task = {
  id: string
  title: string
  description: string
  category: string
  status: TaskStatus
  date: string
}

type Category = {
  id: string
  name: string
}

const DEFAULT_CATEGORIES = [
  { id: "1", name: "Personal" },
  { id: "2", name: "Work" },
  { id: "3", name: "Shopping" },
  { id: "4", name: "Other" },
]

export default function TodoApp() {
  const { theme, setTheme } = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Personal")
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [statusFilter, setStatusFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [categoryFilterDropdownOpen, setCategoryFilterDropdownOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Set isMounted to true when component mounts
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load tasks and categories from localStorage on initial render
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks")
    const savedCategories = localStorage.getItem("categories")

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }

    if (savedCategories) {
      setCategories(JSON.parse(savedCategories))
    }
  }, [])

  // Save tasks and categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories))
  }, [categories])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const addTask = () => {
    if (title.trim() === "") return

    const newTask: Task = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      status: "Pending",
      date: new Date()
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "numeric",
          year: "numeric",
        })
        .replace(/\//g, "/"),
    }

    setTasks([...tasks, newTask])
    setTitle("")
    setDescription("")
  }

  const addCategory = () => {
    if (!newCategoryName || newCategoryName.trim() === "") return

    const exists = categories.some((cat) => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())

    if (exists) {
      alert("Category already exists")
      return
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
    }

    setCategories([...categories, newCategory])
    setNewCategoryName("")
    setShowNewCategoryForm(false)
  }

  const cancelAddCategory = () => {
    setNewCategoryName("")
    setShowNewCategoryForm(false)
  }

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, status } : task)))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const editTask = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setSelectedCategory(task.category)
      deleteTask(id)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    // Filter by status
    if (statusFilter !== "All" && task.status !== statusFilter) return false

    // Filter by category
    if (categoryFilter !== "All Categories" && task.category !== categoryFilter) return false

    return true
  })

  // Prevent hydration mismatch
  if (!isMounted) {
    return null
  }

  const isDark = theme === "dark"

  return (
    <main className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-gray-50"}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? "text-white" : "text-black"}`}>Todo List</h1>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDark ? "text-white" : "text-black"}`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </header>

        <div
          className={`rounded-lg shadow-sm mb-8 p-4 md:p-6 ${
            isDark ? "bg-slate-900 text-white" : "bg-white text-black"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">Add New Task</h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-md ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300 text-black"
              } border`}
            />

            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 rounded-md min-h-[100px] ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300 text-black"
              } border`}
            />

            {!showNewCategoryForm ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <button
                    className={`w-full flex items-center justify-between rounded-md border px-3 py-2 ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300 text-black"
                    }`}
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  >
                    <span>{selectedCategory}</span>
                    <span className="ml-2">▼</span>
                  </button>
                  {categoryDropdownOpen && (
                    <div
                      className={`absolute z-10 mt-1 w-full rounded-md border py-1 ${
                        isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-300"
                      }`}
                    >
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className={`flex items-center px-3 py-2 hover:bg-opacity-10 cursor-pointer ${
                            isDark ? "hover:bg-white text-white" : "hover:bg-gray-100 text-black"
                          } ${category.name === selectedCategory ? "bg-opacity-10 bg-blue-500" : ""}`}
                          onClick={() => {
                            setSelectedCategory(category.name)
                            setCategoryDropdownOpen(false)
                          }}
                        >
                          {category.name === selectedCategory && (
                            <svg
                              className="mr-2 h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          <span>{category.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowNewCategoryForm(true)}
                  className={`px-4 py-2 rounded-md ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                      : "bg-white border-gray-300 text-black hover:bg-gray-100"
                  } border`}
                >
                  New Category
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-md ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300 text-black"
                  } border`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={addCategory}
                    className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Add
                  </button>
                  <button
                    onClick={cancelAddCategory}
                    className={`px-4 py-2 rounded-md ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                        : "bg-white border-gray-300 text-black hover:bg-gray-100"
                    } border`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
              onClick={addTask}
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          </div>
        </div>

        <div
          className={`rounded-lg shadow-sm p-4 md:p-6 ${isDark ? "bg-slate-900 text-white" : "bg-white text-black"}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold">My Tasks</h2>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <button
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 w-full sm:w-auto ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300 text-black"
                  }`}
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                >
                  <Filter className="h-4 w-4" />
                  <span>{statusFilter}</span>
                  <span>▼</span>
                </button>
                {statusDropdownOpen && (
                  <div
                    className={`absolute left-0 sm:right-0 sm:left-auto z-10 mt-1 w-full sm:w-40 rounded-md border py-1 ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-300"
                    }`}
                  >
                    {["All", "Pending", "In Progress", "Completed"].map((status) => (
                      <div
                        key={status}
                        className={`flex items-center px-3 py-2 hover:bg-opacity-10 cursor-pointer ${
                          isDark ? "hover:bg-white text-white" : "hover:bg-gray-100 text-black"
                        } ${status === statusFilter ? "bg-opacity-10 bg-blue-500" : ""}`}
                        onClick={() => {
                          setStatusFilter(status)
                          setStatusDropdownOpen(false)
                        }}
                      >
                        {status === statusFilter && (
                          <svg
                            className="mr-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <span>{status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative w-full sm:w-auto">
                <button
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 w-full sm:w-auto ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300 text-black"
                  }`}
                  onClick={() => setCategoryFilterDropdownOpen(!categoryFilterDropdownOpen)}
                >
                  <Filter className="h-4 w-4" />
                  <span>{categoryFilter}</span>
                  <span>▼</span>
                </button>
                {categoryFilterDropdownOpen && (
                  <div
                    className={`absolute left-0 sm:right-0 sm:left-auto z-10 mt-1 w-full sm:w-40 rounded-md border py-1 ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-300"
                    }`}
                  >
                    <div
                      className={`flex items-center px-3 py-2 hover:bg-opacity-10 cursor-pointer ${
                        isDark ? "hover:bg-white text-white" : "hover:bg-gray-100 text-black"
                      } ${"All Categories" === categoryFilter ? "bg-opacity-10 bg-blue-500" : ""}`}
                      onClick={() => {
                        setCategoryFilter("All Categories")
                        setCategoryFilterDropdownOpen(false)
                      }}
                    >
                      {"All Categories" === categoryFilter && (
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span>All Categories</span>
                    </div>
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className={`flex items-center px-3 py-2 hover:bg-opacity-10 cursor-pointer ${
                          isDark ? "hover:bg-white text-white" : "hover:bg-gray-100 text-black"
                        } ${category.name === categoryFilter ? "bg-opacity-10 bg-blue-500" : ""}`}
                        onClick={() => {
                          setCategoryFilter(category.name)
                          setCategoryFilterDropdownOpen(false)
                        }}
                      >
                        {category.name === categoryFilter && (
                          <svg
                            className="mr-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <span>{category.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No tasks found. Add a new task to get started!</div>
          ) : (
            <ul className="space-y-2">
              {filteredTasks.map((task) => (
                <li
                  key={task.id}
                  className={`p-4 rounded-md border ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <h3 className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{task.title}</h3>
                    {task.description && (
                      <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          task.status === "Pending"
                            ? "bg-amber-800 text-amber-200"
                            : task.status === "In Progress"
                              ? "bg-blue-800 text-blue-200"
                              : "bg-green-800 text-green-200"
                        }`}
                      >
                        {task.status}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          isDark ? "bg-slate-700 text-white" : "bg-gray-200 text-black"
                        }`}
                      >
                        {task.category}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          isDark ? "bg-slate-700 text-white" : "bg-gray-200 text-black"
                        }`}
                      >
                        {task.date}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 mt-2">
                      {task.status === "Pending" && (
                        <button
                          className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                            isDark
                              ? "bg-slate-900 border-slate-700 hover:bg-slate-700 text-white"
                              : "bg-white border-gray-300 hover:bg-gray-100 text-black"
                          } border`}
                          onClick={() => updateTaskStatus(task.id, "In Progress")}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>Start</span>
                        </button>
                      )}
                      {task.status === "In Progress" && (
                        <button
                          className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                            isDark
                              ? "bg-slate-900 border-slate-700 hover:bg-slate-700 text-white"
                              : "bg-white border-gray-300 hover:bg-gray-100 text-black"
                          } border`}
                          onClick={() => updateTaskStatus(task.id, "Completed")}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Complete</span>
                        </button>
                      )}
                      {task.status === "Completed" && (
                        <button
                          className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                            isDark
                              ? "bg-slate-900 border-slate-700 hover:bg-slate-700 text-white"
                              : "bg-white border-gray-300 hover:bg-gray-100 text-black"
                          } border`}
                          onClick={() => updateTaskStatus(task.id, "Pending")}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>Reopen</span>
                        </button>
                      )}
                      <button
                        className={`px-3 py-1 rounded-md ${
                          isDark
                            ? "bg-slate-900 border-slate-700 hover:bg-slate-700 text-white"
                            : "bg-white border-gray-300 hover:bg-gray-100 text-black"
                        } border`}
                        onClick={() => editTask(task.id)}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        className={`px-3 py-1 rounded-md ${
                          isDark
                            ? "bg-slate-900 border-slate-700 hover:bg-slate-700 text-red-400"
                            : "bg-white border-gray-300 hover:bg-gray-100 text-red-500"
                        } border`}
                        onClick={() => deleteTask(task.id)}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
