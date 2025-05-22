"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Plus,
  Calendar,
  AlertCircle,
  X,
  ChevronDown,
  BarChart2,
  Edit,
  Trash,
  Download,
  Upload,
  Bell,
  Loader2,
  Tag,
  GripVertical,
} from "lucide-react"
import { Sun, Moon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Toaster, toast } from "sonner"
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format, isAfter, isBefore, isToday, addDays } from "date-fns"
import { DndContext } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

type TaskPriority = "Low" | "Medium" | "High"

type TaskStatus = "Pending" | "In Progress" | "Completed"

type SubTask = {
  id: string
  title: string
  completed: boolean
}

type Task = {
  id: string
  title: string
  description: string
  category: string
  status: TaskStatus
  priority: TaskPriority
  date: string
  dueDate?: string
  tags: string[]
  subtasks?: SubTask[]
  notes?: string
  attachments?: string[]
  reminder?: string
}

type Category = {
  id: string
  name: string
  color: string
  icon?: string
}

type SortOption = "date" | "priority" | "alphabetical" | "dueDate"

const DEFAULT_CATEGORIES = [
  { id: "1", name: "Personal", color: "#3b82f6", icon: "user" },
  { id: "2", name: "Work", color: "#ef4444", icon: "briefcase" },
  { id: "3", name: "Shopping", color: "#10b981", icon: "shopping-cart" },
  { id: "4", name: "Health", color: "#8b5cf6", icon: "heart" },
  { id: "5", name: "Finance", color: "#f59e0b", icon: "dollar-sign" },
]

const DEFAULT_TAGS = ["Important", "Urgent", "Later", "Quick", "Detailed", "Meeting", "Call", "Email", "Review"]

const priorityColors = {
  Low: "bg-blue-500",
  Medium: "bg-yellow-500",
  High: "bg-red-500",
}

const priorityTextColors = {
  Low: "text-blue-700",
  Medium: "text-yellow-700",
  High: "text-red-700",
}

export default function TodoApp() {
  const [darkMode, setDarkMode] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Personal")
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>("Medium")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dueDate, setDueDate] = useState("")
  const [reminder, setReminder] = useState("")
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [statusFilter, setStatusFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [priorityFilter, setPriorityFilter] = useState("All Priorities")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("date")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6")
  const [newCategoryIcon, setNewCategoryIcon] = useState("folder")
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false)
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [categoryFilterDropdownOpen, setCategoryFilterDropdownOpen] = useState(false)
  const [priorityFilterDropdownOpen, setPriorityFilterDropdownOpen] = useState(false)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editPriority, setEditPriority] = useState<TaskPriority>("Medium")
  const [editDueDate, setEditDueDate] = useState("")
  const [editReminder, setEditReminder] = useState("")
  const [editTags, setEditTags] = useState<string[]>([])
  const [editNotes, setEditNotes] = useState("")
  const [editSubtasks, setEditSubtasks] = useState<SubTask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [editCategoryDropdownOpen, setEditCategoryDropdownOpen] = useState(false)
  const [editPriorityDropdownOpen, setEditPriorityDropdownOpen] = useState(false)
  const [editTagsDropdownOpen, setEditTagsDropdownOpen] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [editCategoryColor, setEditCategoryColor] = useState("")
  const [editCategoryIcon, setEditCategoryIcon] = useState("")
  const [showImportExport, setShowImportExport] = useState(false)
  const [exportData, setExportData] = useState("")
  const [importData, setImportData] = useState("")
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [detailsTask, setDetailsTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState<"details" | "subtasks" | "notes">("details")
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Load tasks and categories from localStorage on initial render
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks")
    const savedCategories = localStorage.getItem("categories")
    const savedTheme = localStorage.getItem("darkMode")

    setTimeout(() => {
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks))
      }

      if (savedCategories) {
        setCategories(JSON.parse(savedCategories))
      }

      if (savedTheme !== null) {
        setDarkMode(JSON.parse(savedTheme))
      }
      setIsLoading(false)
    }, 1000) // Simulate loading for 1 second
  }, [])

  // Save tasks and categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode))
  }, [darkMode])

  // Check for reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      tasks.forEach((task) => {
        if (task.reminder) {
          const reminderTime = new Date(task.reminder)
          if (
            isAfter(now, reminderTime) &&
            isBefore(now, new Date(reminderTime.getTime() + 60000)) // Within 1 minute
          ) {
            toast(
              <div className="flex items-start">
                <Bell className="h-5 w-5 mr-2 text-yellow-500 flex-shrink-0" />
                <div>
                  <div className="font-medium">Reminder</div>
                  <div className="text-sm text-gray-500">Task: {task.title}</div>
                </div>
              </div>,
              {
                duration: 10000,
                action: {
                  label: "View",
                  onClick: () => {
                    setDetailsTask(task)
                    setShowTaskDetails(true)
                  },
                },
              },
            )
          }
        }
      })
    }

    const interval = setInterval(checkReminders, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [tasks])

  const toggleTheme = () => {
    setDarkMode(!darkMode)
    toast.success(`Switched to ${!darkMode ? "dark" : "light"} mode`)
  }

  const addTask = () => {
    if (title.trim() === "") {
      toast.error("Task title cannot be empty")
      return
    }

    setIsAddingTask(true)

    setTimeout(() => {
      const newTask: Task = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        status: "Pending",
        priority: selectedPriority,
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "numeric",
          year: "numeric",
        }),
        dueDate: dueDate || undefined,
        reminder: reminder || undefined,
        tags: selectedTags,
        subtasks: [],
        notes: "",
      }

      setTasks([...tasks, newTask])
      setTitle("")
      setDescription("")
      setSelectedPriority("Medium")
      setDueDate("")
      setReminder("")
      setSelectedTags([])
      setIsAddingTask(false)
      toast.success("Task added successfully")
    }, 800)
  }

  const addCategory = () => {
    if (!newCategoryName || newCategoryName.trim() === "") {
      toast.error("Category name cannot be empty")
      return
    }

    const exists = categories.some((cat) => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())

    if (exists) {
      toast.error("Category already exists")
      return
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      color: newCategoryColor,
      icon: newCategoryIcon,
    }

    setCategories([...categories, newCategory])
    setNewCategoryName("")
    setNewCategoryColor("#3b82f6")
    setNewCategoryIcon("folder")
    setShowNewCategoryForm(false)
    toast.success("Category added successfully")
  }

  const deleteCategory = (id: string) => {
    const categoryToDelete = categories.find((cat) => cat.id === id)
    if (!categoryToDelete) return

    // Check if any tasks are using this category
    const tasksUsingCategory = tasks.filter((task) => task.category === categoryToDelete.name)

    if (tasksUsingCategory.length > 0) {
      toast.error(
        `Cannot delete category "${categoryToDelete.name}" because it is being used by ${tasksUsingCategory.length} tasks`,
      )
      return
    }

    setCategories(categories.filter((cat) => cat.id !== id))
    toast.success(`Category "${categoryToDelete.name}" deleted`)
  }

  const handleEditCategory = (id: string) => {
    const category = categories.find((cat) => cat.id === id)
    if (category) {
      setEditingCategory(category)
      setEditCategoryName(category.name)
      setEditCategoryColor(category.color)
      setEditCategoryIcon(category.icon || "folder")
    }
  }

  const saveEditedCategory = () => {
    if (!editingCategory || editCategoryName.trim() === "") {
      toast.error("Category name cannot be empty")
      return
    }

    const exists = categories.some(
      (cat) => cat.id !== editingCategory.id && cat.name.toLowerCase() === editCategoryName.trim().toLowerCase(),
    )

    if (exists) {
      toast.error("Category name already exists")
      return
    }

    const oldName = editingCategory.name

    const updatedCategories = categories.map((cat) =>
      cat.id === editingCategory.id
        ? {
            ...cat,
            name: editCategoryName.trim(),
            color: editCategoryColor,
            icon: editCategoryIcon,
          }
        : cat,
    )

    // Update all tasks that use this category
    const updatedTasks = tasks.map((task) =>
      task.category === oldName ? { ...task, category: editCategoryName.trim() } : task,
    )

    setCategories(updatedCategories)
    setTasks(updatedTasks)
    cancelEditCategory()
    toast.success("Category updated successfully")
  }

  const cancelEditCategory = () => {
    setEditingCategory(null)
    setEditCategoryName("")
    setEditCategoryColor("")
    setEditCategoryIcon("")
  }

  const cancelAddCategory = () => {
    setNewCategoryName("")
    setNewCategoryColor("#3b82f6")
    setNewCategoryIcon("folder")
    setShowNewCategoryForm(false)
  }

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, status } : task)))
    toast.success(`Task marked as ${status}`)
  }

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find((task) => task.id === id)
    if (!taskToDelete) return

    setTasks(tasks.filter((task) => task.id !== id))
    toast.success(`Task "${taskToDelete.title}" deleted`)
  }

  const editTask = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      setEditingTask(task)
      setEditTitle(task.title)
      setEditDescription(task.description)
      setEditCategory(task.category)
      setEditPriority(task.priority)
      setEditDueDate(task.dueDate || "")
      setEditReminder(task.reminder || "")
      setEditTags(task.tags || [])
      setEditNotes(task.notes || "")
      setEditSubtasks(task.subtasks || [])
      setShowEditModal(true)
    }
  }

  const saveEditedTask = () => {
    if (!editingTask || editTitle.trim() === "") {
      toast.error("Task title cannot be empty")
      return
    }

    const updatedTasks = tasks.map((task) =>
      task.id === editingTask.id
        ? {
            ...task,
            title: editTitle.trim(),
            description: editDescription.trim(),
            category: editCategory,
            priority: editPriority,
            dueDate: editDueDate || undefined,
            reminder: editReminder || undefined,
            tags: editTags,
            notes: editNotes,
            subtasks: editSubtasks,
          }
        : task,
    )

    setTasks(updatedTasks)
    closeEditModal()
    toast.success("Task updated successfully")
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingTask(null)
    setEditTitle("")
    setEditDescription("")
    setEditCategory("")
    setEditPriority("Medium")
    setEditDueDate("")
    setEditReminder("")
    setEditTags([])
    setEditNotes("")
    setEditSubtasks([])
    setNewSubtaskTitle("")
  }

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) {
      toast.error("Subtask title cannot be empty")
      return
    }

    const newSubtask: SubTask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      completed: false,
    }

    setEditSubtasks([...editSubtasks, newSubtask])
    setNewSubtaskTitle("")
  }

  const toggleSubtaskCompletion = (id: string) => {
    setEditSubtasks(
      editSubtasks.map((subtask) => (subtask.id === id ? { ...subtask, completed: !subtask.completed } : subtask)),
    )
  }

  const deleteSubtask = (id: string) => {
    setEditSubtasks(editSubtasks.filter((subtask) => subtask.id !== id))
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const toggleEditTag = (tag: string) => {
    if (editTags.includes(tag)) {
      setEditTags(editTags.filter((t) => t !== tag))
    } else {
      setEditTags([...editTags, tag])
    }
  }

  // Update handleDragEnd to reorder tasks only if all filters are default and no search
  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    // Only allow reordering if all filters are default and no search
    if (
      statusFilter === "All" &&
      categoryFilter === "All Categories" &&
      priorityFilter === "All Priorities" &&
      !searchQuery
    ) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id)
      const newIndex = tasks.findIndex((task) => task.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const newTasks = [...tasks]
      const [movedTask] = newTasks.splice(oldIndex, 1)
      newTasks.splice(newIndex, 0, movedTask)
      setTasks(newTasks)
      toast.success("Task order updated")
    }
  }

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName)
    return category ? category.color : "#3b82f6"
  }

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName)
    return category?.icon || "folder"
  }

  const exportTasks = () => {
    const data = {
      tasks,
      categories,
    }
    setExportData(JSON.stringify(data, null, 2))
    toast.success("Data prepared for export")
  }

  const downloadExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportData)
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "todo-list-export.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
    toast.success("Data exported successfully")
  }

  const importTasks = () => {
    try {
      const data = JSON.parse(importData)
      if (data.tasks && data.categories) {
        setTasks(data.tasks)
        setCategories(data.categories)
        setImportData("")
        toast.success("Data imported successfully")
      } else {
        toast.error("Invalid import data format")
      }
    } catch (error) {
      toast.error("Failed to import data. Invalid JSON format.")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setImportData(content)
      }
      reader.readAsText(file)
    }
  }

  const toggleTaskSelection = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter((taskId) => taskId !== id))
    } else {
      setSelectedTaskIds([...selectedTaskIds, id])
    }
  }

  const selectAllTasks = () => {
    if (selectedTaskIds.length === filteredAndSortedTasks.length) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(filteredAndSortedTasks.map((task) => task.id))
    }
  }

  const bulkDeleteTasks = () => {
    if (selectedTaskIds.length === 0) {
      toast.error("No tasks selected")
      return
    }

    setTasks(tasks.filter((task) => !selectedTaskIds.includes(task.id)))
    toast.success(`${selectedTaskIds.length} tasks deleted`)
    setSelectedTaskIds([])
    setShowBulkActions(false)
  }

  const bulkUpdateStatus = (status: TaskStatus) => {
    if (selectedTaskIds.length === 0) {
      toast.error("No tasks selected")
      return
    }

    setTasks(tasks.map((task) => (selectedTaskIds.includes(task.id) ? { ...task, status } : task)))
    toast.success(`${selectedTaskIds.length} tasks updated to ${status}`)
    setSelectedTaskIds([])
    setShowBulkActions(false)
  }

  const viewTaskDetails = (task: Task) => {
    setDetailsTask(task)
    setShowTaskDetails(true)
  }

  const closeTaskDetails = () => {
    setShowTaskDetails(false)
    setDetailsTask(null)
    setActiveTab("details")
  }

  // Add this function to reset all filters
  const resetAllFilters = () => {
    setStatusFilter("All")
    setCategoryFilter("All Categories")
    setPriorityFilter("All Priorities")
    setSearchQuery("")
  }

  // Update the filteredAndSortedTasks logic to always show all tasks if all filters are at their default values
  const filteredAndSortedTasks = tasks
    .filter((task) => {
      // If all filters are at default, show all tasks
      if (
        statusFilter === "All" &&
        categoryFilter === "All Categories" &&
        priorityFilter === "All Priorities" &&
        !searchQuery
      ) {
        return true
      }
      // Otherwise, apply filters as before
      if (statusFilter !== "All" && task.status !== statusFilter) return false
      if (categoryFilter !== "All Categories" && task.category !== categoryFilter) return false
      if (priorityFilter !== "All Priorities" && task.priority !== priorityFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.category.toLowerCase().includes(query) ||
          (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(query)))
        )
      }
      return true
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "priority":
          const priorityOrder = { High: 0, Medium: 1, Low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case "alphabetical":
          return a.title.localeCompare(b.title)
        case "dueDate":
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case "date":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.status === "Completed").length
    const inProgress = tasks.filter((task) => task.status === "In Progress").length
    const pending = tasks.filter((task) => task.status === "Pending").length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    const categoryStats = categories.map((category) => {
      const count = tasks.filter((task) => task.category === category.name).length
      return { name: category.name, count, color: category.color }
    })

    const priorityStats = [
      { name: "High", count: tasks.filter((task) => task.priority === "High").length, color: "#ef4444" },
      { name: "Medium", count: tasks.filter((task) => task.priority === "Medium").length, color: "#f59e0b" },
      { name: "Low", count: tasks.filter((task) => task.priority === "Low").length, color: "#3b82f6" },
    ]

    // Tasks due today
    const today = new Date()
    const dueToday = tasks.filter((task) => {
      if (!task.dueDate) return false
      return isToday(new Date(task.dueDate))
    }).length

    // Overdue tasks
    const overdue = tasks.filter((task) => {
      if (!task.dueDate || task.status === "Completed") return false
      return isBefore(new Date(task.dueDate), today)
    }).length

    // Tasks due this week
    const dueThisWeek = tasks.filter((task) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return isAfter(dueDate, today) && isBefore(dueDate, addDays(today, 7)) && task.status !== "Completed"
    }).length

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate,
      categoryStats,
      priorityStats,
      dueToday,
      overdue,
      dueThisWeek,
    }
  }

  const stats = getTaskStats()

  const SortableTask = ({ task, showDragHandle = false }: { task: Task; showDragHandle?: boolean }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
      position: 'relative' as const,
      zIndex: isDragging ? 999 : 'auto',
      cursor: showDragHandle ? 'grab' : 'default',
      touchAction: 'none',
    }

    const isSelected = selectedTaskIds.includes(task.id)
    const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), new Date()) && task.status !== "Completed"
    const isDueToday = task.dueDate && isToday(new Date(task.dueDate)) && task.status !== "Completed"

    return (
      <motion.li
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...(showDragHandle ? listeners : {})}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isDragging ? 0.6 : 1,
          y: 0,
          scale: isDragging ? 1.02 : 1,
          rotate: isDragging ? 1 : 0,
          boxShadow: isDragging 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
            : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ 
          duration: 0.2,
          scale: {
            type: "spring",
            stiffness: 300,
            damping: 30
          },
          rotate: {
            type: "spring",
            stiffness: 300,
            damping: 30
          }
        }}
        whileHover={showDragHandle ? {
          scale: 1.01,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: { duration: 0.2 }
        } : {}}
        className={`p-4 rounded-md border shadow-sm ${
          darkMode ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-gray-200"
        } ${showBulkActions ? "hover:border-blue-500 transition-colors" : ""} ${
          isSelected ? "border-blue-500 ring-2 ring-blue-200" : ""
        } flex items-center gap-2 ${isDragging ? 'cursor-grabbing' : ''} ${
          showDragHandle ? 'hover:border-blue-400' : ''
        } transition-all duration-200 ease-in-out`}
      >
        {showDragHandle && (
          <motion.span 
            className="cursor-grab text-gray-400 hover:text-blue-500 active:cursor-grabbing"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <GripVertical className="h-5 w-5" />
          </motion.span>
        )}
        <div className="flex-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {showBulkActions && (
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTaskSelection(task.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                )}
                <div
                  className={`w-3 h-3 rounded-full ${
                    task.status === "Completed"
                      ? "bg-green-500"
                      : task.status === "In Progress"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                  }`}
                ></div>
                <h3
                  className={`font-medium ${darkMode ? "text-white" : "text-gray-900"} cursor-pointer hover:underline`}
                  onClick={() => viewTaskDetails(task)}
                >
                  {task.title}
                </h3>
                {task.subtasks && task.subtasks.length > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      darkMode ? "bg-[#1e293b] text-gray-300" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length}
                  </span>
                )}
              </div>
              <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{task.date}</div>
            </div>
            {task.description && (
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{task.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  task.status === "Pending"
                    ? darkMode
                      ? "bg-amber-900 text-amber-100"
                      : "bg-amber-100 text-amber-800"
                    : task.status === "In Progress"
                      ? darkMode
                        ? "bg-blue-900 text-blue-100"
                        : "bg-blue-100 text-blue-800"
                      : darkMode
                        ? "bg-green-900 text-green-100"
                        : "bg-green-100 text-green-800"
                }`}
              >
                {task.status}
              </span>
              <span
                className="text-xs px-2 py-1 rounded-full text-white flex items-center gap-1"
                style={{ backgroundColor: getCategoryColor(task.category) }}
              >
                {task.category}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  task.priority === "High"
                    ? darkMode
                      ? "bg-red-900 text-red-100"
                      : "bg-red-100 text-red-800"
                    : task.priority === "Medium"
                      ? darkMode
                        ? "bg-yellow-900 text-yellow-100"
                        : "bg-yellow-100 text-yellow-800"
                      : darkMode
                        ? "bg-blue-900 text-blue-100"
                        : "bg-blue-100 text-blue-800"
                } flex items-center gap-1`}
              >
                <AlertCircle className="h-3 w-3" />
                {task.priority}
              </span>
              {task.dueDate && (
                <span
                  className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                    isOverdue
                      ? darkMode
                        ? "bg-red-900 text-red-100"
                        : "bg-red-100 text-red-800"
                      : isDueToday
                        ? darkMode
                          ? "bg-purple-900 text-purple-100"
                          : "bg-purple-100 text-purple-800"
                        : darkMode
                          ? "bg-gray-800 text-gray-300"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  {task.dueDate}
                  {isOverdue && " (Overdue)"}
                  {isDueToday && " (Today)"}
                </span>
              )}
              {task.reminder && (
                <span
                  className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                    darkMode ? "bg-indigo-900 text-indigo-100" : "bg-indigo-100 text-indigo-800"
                  }`}
                >
                  <Bell className="h-3 w-3" />
                  {format(new Date(task.reminder), "MMM d, h:mm a")}
                </span>
              )}
            </div>
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      darkMode ? "bg-[#1e293b] text-gray-300" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 mt-2">
              {task.status === "Pending" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                    darkMode
                      ? "bg-[#0c1425] border-[#1e293b] hover:bg-[#1e293b] text-white"
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
                </motion.button>
              )}
              {task.status === "In Progress" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                    darkMode
                      ? "bg-[#0c1425] border-[#1e293b] hover:bg-[#1e293b] text-white"
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
                </motion.button>
              )}
              {task.status === "Completed" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                    darkMode
                      ? "bg-[#0c1425] border-[#1e293b] hover:bg-[#1e293b] text-white"
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
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 rounded-md ${
                  darkMode
                    ? "bg-[#0c1425] border-[#1e293b] hover:bg-[#1e293b] text-white"
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
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 rounded-md ${
                  darkMode
                    ? "bg-[#0c1425] border-[#1e293b] hover:bg-[#1e293b] text-red-400"
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
              </motion.button>
            </div>
          </div>
        </div>
      </motion.li>
    )
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#0f172a]" : "bg-[#f8fafc]"}`}>
        <div className="text-center">
          <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
          <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Loading your tasks...
          </h2>
          <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Please wait while we prepare your todo list
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={darkMode ? "dark" : "light"}>
      <Toaster position="top-right" richColors closeButton />
      <main className={darkMode ? "bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0c1425] min-h-screen font-sans" : "bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#c7d2fe] min-h-screen font-sans"}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <header className="flex items-center justify-between mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-3xl md:text-4xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}
              style={{ fontFamily: 'Inter, Roboto, sans-serif' }}
            >
              Todo List
            </motion.h1>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className={`p-2 rounded-full ${
                  darkMode ? "bg-[#1e293b] text-white" : "bg-gray-200 text-gray-800"
                } flex items-center justify-center`}
                aria-label="Manage categories"
              >
                <Tag className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowImportExport(!showImportExport)}
                className={`p-2 rounded-full ${
                  darkMode ? "bg-[#1e293b] text-white" : "bg-gray-200 text-gray-800"
                } flex items-center justify-center`}
                aria-label="Import/Export"
              >
                <Download className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowStats(!showStats)}
                className={`p-2 rounded-full ${
                  darkMode ? "bg-[#1e293b] text-white" : "bg-gray-200 text-gray-800"
                } flex items-center justify-center`}
                aria-label="Show statistics"
              >
                <BarChart2 className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`p-2 rounded-full ${
                  darkMode ? "bg-[#1e293b] text-white" : "bg-gray-200 text-gray-800"
                } flex items-center justify-center`}
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.button>
            </div>
          </header>

          {/* Search and Sort Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 animate-fade-in">
            <input
              type="text"
              aria-label="Search tasks"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`flex-1 px-4 py-2 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-400 transition-all ${darkMode ? "bg-[#0f172a] border-[#1e293b] text-white placeholder:text-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"}`}
            />
            <div className="relative min-w-[180px]">
              <button
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 w-full shadow-sm transition-all ${darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"}`}
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={sortDropdownOpen}
              >
                <ChevronDown className="h-4 w-4" />
                <span>Sort: {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}</span>
              </button>
              {sortDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute z-10 mt-1 w-full rounded-lg border py-1 shadow-lg ${darkMode ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-gray-300"}`}
                  role="listbox"
                >
                  {["date", "priority", "alphabetical", "dueDate"].map(opt => (
                    <div
                      key={opt}
                      className={`px-4 py-2 cursor-pointer hover:bg-blue-500 hover:text-white rounded transition-all ${sortOption === opt ? "bg-blue-500 text-white" : ""}`}
                      onClick={() => { setSortOption(opt as SortOption); setSortDropdownOpen(false); }}
                      role="option"
                      aria-selected={sortOption === opt}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showCategoryManager && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-lg shadow-sm mb-8 p-6 ${
                  darkMode ? "bg-[#0c1425] text-white" : "bg-white text-gray-900"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Category Manager</h2>
                  <button
                    onClick={() => setShowCategoryManager(false)}
                    className={`p-1 rounded-full ${darkMode ? "hover:bg-[#1e293b]" : "hover:bg-gray-100"}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <button
                    onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                      darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Category</span>
                  </button>
                </div>

                {showNewCategoryForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-md border mb-4 ${
                      darkMode ? "border-[#1e293b] bg-[#0f172a]" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <h3 className="font-medium mb-3">New Category</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className={`px-3 py-2 rounded-md ${
                          darkMode
                            ? "bg-[#1e293b] border-[#2d3748] text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      <div className="flex items-center gap-2">
                        <label className={darkMode ? "text-gray-300" : "text-gray-700"}>Color:</label>
                        <input
                          type="color"
                          value={newCategoryColor}
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                          className="h-8 w-8 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addCategory}
                          className="flex-1 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={cancelAddCategory}
                          className={`px-4 py-2 rounded-md ${
                            darkMode
                              ? "bg-[#1e293b] text-white hover:bg-[#2d3748]"
                              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                          } transition-colors`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {editingCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-md border mb-4 ${
                      darkMode ? "border-[#1e293b] bg-[#0f172a]" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <h3 className="font-medium mb-3">Edit Category</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Category name"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className={`px-3 py-2 rounded-md ${
                          darkMode
                            ? "bg-[#1e293b] border-[#2d3748] text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      <div className="flex items-center gap-2">
                        <label className={darkMode ? "text-gray-300" : "text-gray-700"}>Color:</label>
                        <input
                          type="color"
                          value={editCategoryColor}
                          onChange={(e) => setEditCategoryColor(e.target.value)}
                          className="h-8 w-8 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEditedCategory}
                          className="flex-1 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditCategory}
                          className={`px-4 py-2 rounded-md ${
                            darkMode
                              ? "bg-[#1e293b] text-white hover:bg-[#2d3748]"
                              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                          } transition-colors`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-4 rounded-md border ${
                        darkMode ? "border-[#1e293b] bg-[#0f172a]" : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditCategory(category.id)}
                            className={`p-1 rounded-full ${darkMode ? "hover:bg-[#1e293b]" : "hover:bg-gray-100"}`}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className={`p-1 rounded-full ${
                              darkMode ? "hover:bg-[#1e293b] text-red-400" : "hover:bg-gray-100 text-red-500"
                            }`}
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {tasks.filter((task) => task.category === category.name).length} tasks
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showImportExport && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-lg shadow-sm mb-8 p-6 ${
                  darkMode ? "bg-[#0c1425] text-white" : "bg-white text-gray-900"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Import / Export</h2>
                  <button
                    onClick={() => setShowImportExport(false)}
                    className={`p-1 rounded-full ${darkMode ? "hover:bg-[#1e293b]" : "hover:bg-gray-100"}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Export Data</h3>
                    <p className={`mb-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Export your tasks and categories to a JSON file that you can backup or import later.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={exportTasks}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                          darkMode
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                      >
                        <Download className="h-4 w-4" />
                        <span>Prepare Export</span>
                      </button>
                      {exportData && (
                        <button
                          onClick={downloadExport}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                            darkMode
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                          }`}
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                    {exportData && (
                      <div
                        className={`mt-4 p-3 rounded-md border ${
                          darkMode ? "border-[#1e293b] bg-[#0f172a]" : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Export Preview</span>
                          <span className="text-sm">
                            {tasks.length} tasks, {categories.length} categories
                          </span>
                        </div>
                        <div
                          className={`text-xs overflow-auto max-h-40 p-2 rounded ${
                            darkMode ? "bg-[#1e293b] text-gray-300" : "bg-white text-gray-700"
                          }`}
                        >
                          <pre>{exportData.substring(0, 500)}...</pre>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Import Data</h3>
                    <p className={`mb-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Import tasks and categories from a previously exported JSON file.
                    </p>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                            darkMode
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-blue-500 hover:bg-blue-600 text-white"
                          }`}
                        >
                          <Upload className="h-4 w-4" />
                          <span>Select File</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept=".json"
                          className="hidden"
                        />
                        {importData && (
                          <button
                            onClick={importTasks}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                              darkMode
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                          >
                            <Upload className="h-4 w-4" />
                            <span>Import</span>
                          </button>
                        )}
                      </div>
                      {importData && (
                        <div
                          className={`p-3 rounded-md border ${
                            darkMode ? "border-[#1e293b] bg-[#0f172a]" : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="font-medium mb-2">File Selected</div>
                          <div
                            className={`text-xs overflow-auto max-h-40 p-2 rounded ${
                              darkMode ? "bg-[#1e293b] text-gray-300" : "bg-white text-gray-700"
                            }`}
                          >
                            <pre>{importData.substring(0, 500)}...</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-lg shadow-sm mb-8 p-6 ${
                  darkMode ? "bg-[#0c1425] text-white" : "bg-white text-gray-900"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Task Statistics</h2>
                  <button
                    onClick={() => setShowStats(false)}
                    className={`p-1 rounded-full ${darkMode ? "hover:bg-[#1e293b]" : "hover:bg-gray-100"}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-[#1e293b]" : "bg-gray-100"
                    } flex flex-col items-center justify-center`}
                  >
                    <span className="text-3xl font-bold">{stats.total}</span>
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Tasks</span>
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-[#1e293b]" : "bg-gray-100"
                    } flex flex-col items-center justify-center`}
                  >
                    <span className="text-3xl font-bold text-green-500">{stats.completed}</span>
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Completed</span>
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-[#1e293b]" : "bg-gray-100"
                    } flex flex-col items-center justify-center`}
                  >
                    <span className="text-3xl font-bold text-blue-500">{stats.inProgress}</span>
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>In Progress</span>
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-[#1e293b]" : "bg-gray-100"
                    } flex flex-col items-center justify-center`}
                  >
                    <span className="text-3xl font-bold text-amber-500">{stats.pending}</span>
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Pending</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-[#1e293b]" : "bg-gray-100"
                    } flex flex-col items-center justify-center`}
                  >
                    <span className="text-3xl font-bold text-purple-500">{stats.dueToday}</span>
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Due Today</span>
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-[#1e293b]" : "bg-gray-100"
                    } flex flex-col items-center justify-center`}
                  >
                    <span className="text-3xl font-bold text-red-500">{stats.overdue}</span>
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Overdue</span>
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-[#1e293b]" : "bg-gray-100"
                    } flex flex-col items-center justify-center`}
                  >
                    <span className="text-3xl font-bold text-indigo-500">{stats.dueThisWeek}</span>
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Due This Week</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Completion Rate</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm mt-1">{stats.completionRate}%</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Tasks by Category</h3>
                    <div className="space-y-2">
                      {stats.categoryStats
                        .filter((cat) => cat.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .map((cat) => (
                          <div key={cat.name} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }}></div>
                              <span>{cat.name}</span>
                            </div>
                            <span>{cat.count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Tasks by Priority</h3>
                    <div className="space-y-2">
                      {stats.priorityStats
                        .filter((p) => p.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .map((priority) => (
                          <div key={priority.name} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: priority.color }}
                              ></div>
                              <span>{priority.name}</span>
                            </div>
                            <span>{priority.count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg shadow-sm mb-8 p-6 ${darkMode ? "bg-[#0c1425] text-white" : "bg-white text-gray-900"}`}
          >
            <h2 className="text-xl font-bold mb-4">Add New Task</h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"
                } border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              />

              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3 py-2 rounded-md min-h-[100px] ${
                  darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"
                } border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Category
                  </label>
                  <button
                    className={`w-full flex items-center justify-between rounded-md border px-3 py-2 ${
                      darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getCategoryColor(selectedCategory) }}
                      ></div>
                      <span>{selectedCategory}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {categoryDropdownOpen && (
                    <div
                      className={`absolute z-10 mt-1 w-full rounded-md border py-1 ${
                        darkMode ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-gray-300"
                      }`}
                    >
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className={`flex items-center px-3 py-2 hover:bg-opacity-10 cursor-pointer ${
                            darkMode ? "hover:bg-white text-white" : "hover:bg-gray-100 text-gray-900"
                          } ${category.name === selectedCategory ? "bg-opacity-10 bg-blue-500" : ""}`}
                          onClick={() => {
                            setSelectedCategory(category.name)
                            setCategoryDropdownOpen(false)
                          }}
                        >
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                          <span>{category.name}</span>
                          {category.name === selectedCategory && (
                            <svg
                              className="ml-auto h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ))}
                      <div
                        className={`flex items-center px-3 py-2 hover:bg-opacity-10 cursor-pointer ${
                          darkMode ? "hover:bg-white text-white" : "hover:bg-gray-100 text-gray-900"
                        }`}
                        onClick={() => {
                          setCategoryDropdownOpen(false)
                          setShowNewCategoryForm(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Add New Category</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Priority
                  </label>
                  <button
                    className={`w-full flex items-center justify-between rounded-md border px-3 py-2 ${
                      darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
                    onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${
                          selectedPriority === "High"
                            ? "bg-red-500"
                            : selectedPriority === "Medium"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                      ></div>
                      <span>{selectedPriority}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {priorityDropdownOpen && (
                    <div
                      className={`absolute z-10 mt-1 w-full rounded-md border py-1 ${
                        darkMode ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-gray-300"
                      }`}
                    >
                      {(["High", "Medium", "Low"] as TaskPriority[]).map((priority) => (
                        <div
                          key={priority}
                          className={`flex items-center px-3 py-2 hover:bg-opacity-10 cursor-pointer ${
                            darkMode ? "hover:bg-white text-white" : "hover:bg-gray-100 text-gray-900"
                          } ${priority === selectedPriority ? "bg-opacity-10 bg-blue-500" : ""}`}
                          onClick={() => {
                            setSelectedPriority(priority)
                            setPriorityDropdownOpen(false)
                          }}
                        >
                          <div
                            className={`w-3 h-3 rounded-full mr-2 ${
                              priority === "High"
                                ? "bg-red-500"
                                : priority === "Medium"
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                            }`}
                          ></div>
                          <span>{priority}</span>
                          {priority === selectedPriority && (
                            <svg
                              className="ml-auto h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"
                    } border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Reminder (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={reminder}
                    onChange={(e) => setReminder(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"
                    } border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Tags (Optional)
                  </label>
                  <div className="relative">
                    <button
                      className={`w-full flex items-center justify-between rounded-md border px-3 py-2 ${
                        darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                      onClick={() => setTagsDropdownOpen(!tagsDropdownOpen)}
                    >
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.length > 0 ? (
                          selectedTags.map((tag) => (
                            <span
                              key={tag}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                darkMode ? "bg-[#1e293b] text-gray-300" : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Select tags</span>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                    </button>
                    {tagsDropdownOpen && (
                      <div
                        className={`absolute z-10 mt-1 w-full rounded-md border py-1 ${
                          darkMode ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-gray-300"
                        }`}
                      >
                        {DEFAULT_TAGS.map((tag) => (
                          <div
                            key={tag}
                            className={`flex items-center px-3 py-2 hover:bg-opacity-10 cursor-pointer ${
                              darkMode ? "hover:bg-white text-white" : "hover:bg-gray-100 text-gray-900"
                            } ${selectedTags.includes(tag) ? "bg-opacity-10 bg-blue-500" : ""}`}
                            onClick={() => toggleTag(tag)}
                          >
                            <span>#{tag}</span>
                            {selectedTags.includes(tag) && (
                              <svg
                                className="ml-auto h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {showNewCategoryForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`border p-4 rounded-md space-y-4 ${
                    darkMode ? "border-[#1e293b] bg-[#0f172a]" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <h3 className="font-medium">Add New Category</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-md ${
                        darkMode ? "bg-[#1e293b] border-[#2d3748] text-white" : "bg-white border-gray-300 text-gray-900"
                      } border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    />
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addCategory}
                        className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                      >
                        Add
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={cancelAddCategory}
                        className={`px-4 py-2 rounded-md ${
                          darkMode
                            ? "bg-[#1e293b] text-white hover:bg-[#2d3748]"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        } transition-colors`}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors ${
                  isAddingTask ? "opacity-70 cursor-not-allowed" : ""
                }`}
                onClick={addTask}
                disabled={isAddingTask}
              >
                {isAddingTask ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                <span>{isAddingTask ? "Adding Task..." : "Add Task"}</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Reset Filters Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 rounded-md bg-gray-500 hover:bg-gray-600 text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>

          {/* Filters above My Tasks */}
          <div className="flex items-center gap-4 mb-4">
            {/* Status Filter */}
            <div className="relative">
              <button
                className={`flex items-center gap-2 rounded-md border px-3 py-2 min-w-[120px] ${darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"}`}
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              >
                <ChevronDown className="h-4 w-4" />
                <span>{statusFilter}</span>
              </button>
              {statusDropdownOpen && (
                <div className={`absolute z-10 mt-1 w-full rounded-md border py-1 ${darkMode ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-gray-300"}`}>
                  {["All", "Pending", "In Progress", "Completed"].map((status) => (
                    <div
                      key={status}
                      className={`flex items-center px-3 py-2 hover:bg-opacity-10 cursor-pointer ${darkMode ? "hover:bg-white text-white" : "hover:bg-gray-100 text-gray-900"} ${status === statusFilter ? "bg-opacity-10 bg-blue-500" : ""}`}
                      onClick={() => {
                        setStatusFilter(status)
                        setStatusDropdownOpen(false)
                      }}
                    >
                      {status}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Category Filter */}
            <div className="relative">
              <button
                className={`flex items-center gap-2 rounded-md border px-3 py-2 min-w-[150px] ${darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"}`}
                onClick={() => setCategoryFilterDropdownOpen(!categoryFilterDropdownOpen)}
              >
                <ChevronDown className="h-4 w-4" />
                <span>{categoryFilter}</span>
              </button>
              {categoryFilterDropdownOpen && (
                <div className={`absolute z-10 mt-1 w-full rounded-md border py-1 ${darkMode ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-gray-300"}`}>
                  <div
                    className={`flex items-center px-3 py-2 hover:bg-opacity-10 cursor-pointer ${darkMode ? "hover:bg-white text-white" : "hover:bg-gray-100 text-gray-900"} ${"All Categories" === categoryFilter ? "bg-opacity-10 bg-blue-500" : ""}`}
                    onClick={() => {
                      setCategoryFilter("All Categories")
                      setCategoryFilterDropdownOpen(false)
                    }}
                  >
                    All Categories
                  </div>
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center px-3 py-2 hover:bg-opacity-10 cursor-pointer ${darkMode ? "hover:bg-white text-white" : "hover:bg-gray-100 text-gray-900"} ${category.name === categoryFilter ? "bg-opacity-10 bg-blue-500" : ""}`}
                      onClick={() => {
                        setCategoryFilter(category.name)
                        setCategoryFilterDropdownOpen(false)
                      }}
                    >
                      {category.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* My Tasks Section */}
          <div className={`rounded-lg shadow-sm p-6 mb-8 ${darkMode ? "bg-[#0c1425] text-white" : "bg-white text-gray-900"}`}>
            <h2 className="text-xl font-bold mb-4">My Tasks</h2>
            {filteredAndSortedTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No tasks found. Add a new task to get started!
              </div>
            ) : (
              // Enable drag-and-drop only if all filters are default and no search
              statusFilter === "All" &&
              categoryFilter === "All Categories" &&
              priorityFilter === "All Priorities" &&
              !searchQuery ? (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2">
                      {tasks.map((task) => (
                        <SortableTask key={task.id} task={task} showDragHandle />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              ) : (
                <ul className="space-y-2">
                  {filteredAndSortedTasks.map((task) => (
                    <SortableTask key={task.id} task={task} showDragHandle={false} />
                  ))}
                </ul>
              )
            )}
          </div>

          {/* Edit Task Modal */}
          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className={`w-full max-w-lg p-6 rounded-lg shadow-lg ${darkMode ? "bg-[#0c1425] text-white" : "bg-white text-gray-900"}`}>
                <h2 className="text-xl font-bold mb-4">Edit Task</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md ${darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"} border`}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md min-h-[100px] ${darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"} border`}
                  />
                  {/* Category */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className={`w-full px-3 py-2 rounded-md ${darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"} border`}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Priority */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                      className={`w-full px-3 py-2 rounded-md ${darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"} border`}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  {/* Due Date */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Due Date</label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-md ${darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"} border`}
                    />
                  </div>
                  {/* Reminder */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Reminder</label>
                    <input
                      type="datetime-local"
                      value={editReminder}
                      onChange={(e) => setEditReminder(e.target.value)}
                      className={`w-full px-3 py-2 rounded-md ${darkMode ? "bg-[#0f172a] border-[#1e293b] text-white" : "bg-white border-gray-300 text-gray-900"} border`}
                    />
                  </div>
                  {/* Tags */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className={`px-2 py-1 rounded-full text-xs border ${editTags.includes(tag) ? (darkMode ? "bg-blue-700 text-white" : "bg-blue-200 text-blue-800") : (darkMode ? "bg-[#1e293b] text-gray-300" : "bg-gray-100 text-gray-700")}`}
                          onClick={() => toggleEditTag(tag)}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={closeEditModal}
                    className="px-4 py-2 rounded-md bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditedTask}
                    className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

