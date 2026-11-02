"use strict";
const STORAGE_KEY = "cse343-todo-tasks";
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const itemsLeft = document.getElementById("items-left");
const emptyMessage = document.getElementById("empty-message");
const clearCompletedButton = document.getElementById("clear-completed");
const clearAllButton = document.getElementById("clear-all");
const filterButtons = document.querySelectorAll(".filter-button");
let todos = loadTodos();
let currentFilter = "all";
function loadTodos() {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    if (!savedTodos) {
        return [];
    }
    try {
        const parsedTodos = JSON.parse(savedTodos);
        if (!Array.isArray(parsedTodos)) {
            return [];
        }
        return parsedTodos.filter((item) => {
            return (typeof item === "object" &&
                item !== null &&
                "id" in item && typeof item.id === "string" &&
                "text" in item && typeof item.text === "string" &&
                "completed" in item && typeof item.completed === "boolean");
        });
    }
    catch {
        return [];
    }
}
function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function getVisibleTodos() {
    if (currentFilter === "active") {
        return todos.filter((todo) => !todo.completed);
    }
    if (currentFilter === "completed") {
        return todos.filter((todo) => todo.completed);
    }
    return todos;
}
function renderTasks() {
    taskList.replaceChildren();
    const visibleTodos = getVisibleTodos();
    visibleTodos.forEach((todo) => {
        const listItem = document.createElement("li");
        listItem.className = "task-item";
        if (todo.completed) {
            listItem.classList.add("is-completed");
        }
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = todo.completed;
        checkbox.setAttribute("aria-label", `Mark ${todo.text} as completed`);
        checkbox.addEventListener("change", () => toggleTodo(todo.id));
        const taskText = document.createElement("span");
        taskText.className = "task-text";
        taskText.textContent = todo.text;
        taskText.title = "Double-click to edit";
        taskText.addEventListener("dblclick", () => startEditing(todo, taskText));
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", `Delete ${todo.text}`);
        deleteButton.title = "Delete task";
        deleteButton.addEventListener("click", () => deleteTodo(todo.id));
        listItem.append(checkbox, taskText, deleteButton);
        taskList.appendChild(listItem);
    });
    const activeCount = todos.filter((todo) => !todo.completed).length;
    itemsLeft.textContent = `${activeCount} ${activeCount === 1 ? "item" : "items"} left`;
    emptyMessage.hidden = visibleTodos.length > 0;
    clearCompletedButton.disabled = !todos.some((todo) => todo.completed);
    clearAllButton.disabled = todos.length === 0;
}
function addTodo(text) {
    const newTodo = {
        id: createId(),
        text,
        completed: false
    };
    todos.push(newTodo);
    saveTodos();
    renderTasks();
}
function toggleTodo(id) {
    todos = todos.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo);
    saveTodos();
    renderTasks();
}
function deleteTodo(id) {
    todos = todos.filter((todo) => todo.id !== id);
    saveTodos();
    renderTasks();
}
function startEditing(todo, taskText) {
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "edit-input";
    editInput.value = todo.text;
    editInput.maxLength = 120;
    editInput.setAttribute("aria-label", "Edit task");
    taskText.replaceWith(editInput);
    editInput.focus();
    editInput.select();
    let editingFinished = false;
    const finishEditing = (save) => {
        if (editingFinished) {
            return;
        }
        editingFinished = true;
        if (save) {
            const newText = editInput.value.trim();
            if (newText.length > 0) {
                todos = todos.map((item) => item.id === todo.id ? { ...item, text: newText } : item);
                saveTodos();
            }
        }
        renderTasks();
    };
    editInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            finishEditing(true);
        }
        else if (event.key === "Escape") {
            finishEditing(false);
        }
    });
    editInput.addEventListener("blur", () => finishEditing(true));
}
function setFilter(filter) {
    currentFilter = filter;
    filterButtons.forEach((button) => {
        const isSelected = button.dataset.filter === filter;
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });
    renderTasks();
}
taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = taskInput.value.trim();
    if (text.length === 0) {
        return;
    }
    addTodo(text);
    taskInput.value = "";
    taskInput.focus();
});
filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        setFilter(filter);
    });
});
clearCompletedButton.addEventListener("click", () => {
    todos = todos.filter((todo) => !todo.completed);
    saveTodos();
    renderTasks();
});
clearAllButton.addEventListener("click", () => {
    todos = [];
    saveTodos();
    renderTasks();
});
renderTasks();
