let tasks = [];
let visibleTaskCount = 5;

window.loadTasks = async function () {
    try {
        const res = await fetch('/tasks');
        tasks = await res.json();
        tasks.sort((a, b) => b.TaskID - a.TaskID);
        renderTasks();
    } catch (error) {
        console.error("Error loading tasks:", error);
    }
};

window.showMoreTasks = function () {
    visibleTaskCount += 5;
    renderTasks();
};

function renderTasks() {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = tasks.slice(0, visibleTaskCount).map(task => `
    <div class="task-card" style="border-left: 5px solid ${task.Color}">
      <h3>${task.TaskName}</h3>
      <p>Due: ${new Date(task.DueDate).toLocaleString()}</p>
      <p>Priority: ${task.PriorityID}</p>
      <p>Category: ${task.Category}</p>
    </div>
  `).join('');

    document.getElementById("show-more-btn").style.display =
        visibleTaskCount < tasks.length ? "block" : "none";
}

window.onload = loadTasks;
