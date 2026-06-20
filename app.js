// ==========================================================================
// State Management & Constants
// ==========================================================================
const DEFAULT_TOPIC = "인공지능(AI)에게 법적·도덕적 책임을 부여해야 하는가?";
const DEFAULT_OPINIONS = [
    {
        id: 1,
        type: "찬성",
        content: "AI가 자율적으로 내린 결정으로 피해가 발생했다면, AI 자체에 책임을 묻는 제도가 필요합니다. 자율적 판단 능력이 있다면 의무도 따라야 합니다.",
        comments: ["그 책임은 결국 개발자나 운영자가 져야 하는 것 아닐까요?", "AI의 자산이나 권리를 보장하지 않으면서 책임만 묻는 것은 모순입니다."],
        studentId: "system",
        date: new Date().toLocaleDateString()
    },
    {
        id: 2,
        type: "반대",
        content: "AI는 인간이 프로그래밍한 코드와 데이터의 조합일 뿐, 고유한 의지나 도덕적 의식이 없으므로 책임의 주체가 될 수 없습니다.",
        comments: ["학습 데이터에 따라 스스로 진화하여 예상치 못한 결정을 내리는 AI도 단순 도구로만 볼 수 있을까요?"],
        studentId: "system",
        date: new Date().toLocaleDateString()
    }
];

// App State
let state = {
    topic: DEFAULT_TOPIC,
    opinions: [...DEFAULT_OPINIONS],
    studentId: "",
    studentLoggedIn: false,
    adminAuthenticated: false
};

// Current view in sidebar: 'student' or 'teacher'
let currentSidebarMode = 'student';

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    loadState();
    initUI();
    renderTopic();
    renderBoard();
    updateFormsState();
    
    // Setup enter keys for inputs
    document.getElementById("student-id-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") loginStudent();
    });
    document.getElementById("teacher-code-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") loginTeacher();
    });
});

// Load state from LocalStorage
function loadState() {
    // Load Topic & Opinions
    const savedTopic = localStorage.getItem("hsy_topic");
    const savedOpinions = localStorage.getItem("hsy_opinions");
    
    if (savedTopic !== null) {
        state.topic = savedTopic;
    } else {
        localStorage.setItem("hsy_topic", state.topic);
    }
    
    if (savedOpinions !== null) {
        state.opinions = JSON.parse(savedOpinions);
    } else {
        localStorage.setItem("hsy_opinions", JSON.stringify(state.opinions));
    }
    
    // Load Session (using SessionStorage to mimic Streamlit's refresh behavior, or LocalStorage. Let's use SessionStorage so refreshing the page keeps login, but closing tab logs out)
    const savedStudentId = sessionStorage.getItem("hsy_student_id");
    const savedStudentLoggedIn = sessionStorage.getItem("hsy_student_logged_in");
    const savedAdminAuth = sessionStorage.getItem("hsy_admin_authenticated");
    
    if (savedStudentLoggedIn === "true" && savedStudentId) {
        state.studentId = savedStudentId;
        state.studentLoggedIn = true;
    }
    
    if (savedAdminAuth === "true") {
        state.adminAuthenticated = true;
    }
}

// Save dynamic content to LocalStorage
function saveBoardData() {
    localStorage.setItem("hsy_topic", state.topic);
    localStorage.setItem("hsy_opinions", JSON.stringify(state.opinions));
}

// Save authentication session to SessionStorage
function saveSessionData() {
    sessionStorage.setItem("hsy_student_id", state.studentId);
    sessionStorage.setItem("hsy_student_logged_in", state.studentLoggedIn);
    sessionStorage.setItem("hsy_admin_authenticated", state.adminAuthenticated);
}

// Initialize UI elements based on loaded state
function initUI() {
    // If student is already logged in, show profile
    if (state.studentLoggedIn) {
        document.getElementById("student-login-form").classList.add("hidden");
        document.getElementById("student-profile").classList.remove("hidden");
        document.getElementById("display-student-id").textContent = state.studentId;
    }
    
    // If teacher is authenticated, show profile
    if (state.adminAuthenticated) {
        document.getElementById("teacher-login-form").classList.add("hidden");
        document.getElementById("teacher-profile").classList.remove("hidden");
        document.getElementById("new-topic-input").value = state.topic;
    }
    
    // Initial Icon Render
    lucide.createIcons();
}

// ==========================================================================
// Mode Switching (Sidebar Tabs)
// ==========================================================================
function switchMode(mode) {
    if (currentSidebarMode === mode) return;
    
    currentSidebarMode = mode;
    
    const tabStudent = document.getElementById("tab-student");
    const tabTeacher = document.getElementById("tab-teacher");
    const sectionStudent = document.getElementById("student-section");
    const sectionTeacher = document.getElementById("teacher-section");
    
    if (mode === 'student') {
        tabStudent.classList.add("active");
        tabTeacher.classList.remove("active");
        sectionStudent.classList.remove("hidden");
        sectionTeacher.classList.add("hidden");
    } else {
        tabStudent.classList.remove("active");
        tabTeacher.classList.add("active");
        sectionStudent.classList.add("hidden");
        sectionTeacher.classList.remove("hidden");
    }
}

// ==========================================================================
// Authentication Logic
// ==========================================================================

// Student Login
function loginStudent() {
    const input = document.getElementById("student-id-input");
    const studentId = input.value.trim();
    
    if (!studentId) {
        showToast("학번을 입력해주세요.", "error");
        return;
    }
    
    state.studentId = studentId;
    state.studentLoggedIn = true;
    saveSessionData();
    
    // Update UI
    document.getElementById("student-login-form").classList.add("hidden");
    document.getElementById("student-profile").classList.remove("hidden");
    document.getElementById("display-student-id").textContent = studentId;
    input.value = "";
    
    updateFormsState();
    renderBoard(); // Rerender board to enable/disable comment fields
    showToast(`${studentId} 학번으로 토론방에 입장했습니다.`, "success");
}

// Student Logout
function logoutStudent() {
    state.studentId = "";
    state.studentLoggedIn = false;
    saveSessionData();
    
    // Update UI
    document.getElementById("student-login-form").classList.remove("hidden");
    document.getElementById("student-profile").classList.add("hidden");
    
    updateFormsState();
    renderBoard(); // Rerender board to update comment fields
    showToast("로그아웃 되었습니다.", "info");
}

// Teacher Authentication
function loginTeacher() {
    const input = document.getElementById("teacher-code-input");
    const code = input.value.trim();
    
    if (code === "t777") {
        state.adminAuthenticated = true;
        saveSessionData();
        
        // Update UI
        document.getElementById("teacher-login-form").classList.add("hidden");
        document.getElementById("teacher-profile").classList.remove("hidden");
        document.getElementById("new-topic-input").value = state.topic;
        input.value = "";
        
        updateFormsState();
        renderBoard(); // Rerender board to update comment fields
        showToast("관리자 인증에 성공했습니다.", "success");
    } else {
        showToast("올바른 인증 코드가 아닙니다.", "error");
    }
}

// Teacher Logout
function logoutTeacher() {
    state.adminAuthenticated = false;
    saveSessionData();
    
    // Update UI
    document.getElementById("teacher-login-form").classList.remove("hidden");
    document.getElementById("teacher-profile").classList.add("hidden");
    
    updateFormsState();
    renderBoard(); // Rerender board to update comment fields
    showToast("관리자 권한이 해제되었습니다.", "info");
}

// Update accessibility of form panels (disable/enable overlay cards)
function updateFormsState() {
    const opinionForm = document.getElementById("opinion-form-container");
    const teacherConsole = document.getElementById("teacher-console");
    
    if (state.studentLoggedIn) {
        opinionForm.classList.remove("disabled");
    } else {
        opinionForm.classList.add("disabled");
    }
    
    if (state.adminAuthenticated) {
        teacherConsole.classList.remove("disabled");
    } else {
        teacherConsole.classList.add("disabled");
    }
}

// ==========================================================================
// Rendering Topic & Opinions Board
// ==========================================================================

function renderTopic() {
    document.getElementById("current-topic-text").textContent = state.topic;
}

// Render the entire discussion board
function renderBoard() {
    const proList = document.getElementById("pro-list");
    const conList = document.getElementById("con-list");
    
    proList.innerHTML = "";
    conList.innerHTML = "";
    
    let proCount = 0;
    let conCount = 0;
    
    state.opinions.forEach(op => {
        // Calculate constant rotation angle based on ID to avoid jittering
        const rotationDeg = (op.id * 7) % 5 - 2; // Range: -2 to 2 degrees
        
        const card = document.createElement("div");
        card.className = `postit-card ${op.type === '찬성' ? 'pro' : 'con'}`;
        card.style.setProperty('--rotation', `${rotationDeg}deg`);
        card.style.transform = `rotate(${rotationDeg}deg)`;
        
        // Opinion Header (Anonymous post-it style)
        const header = document.createElement("div");
        header.className = "postit-header";
        header.innerHTML = `<span>📌 익명 의견 #${op.id}</span><span>${op.date || ''}</span>`;
        card.appendChild(header);
        
        // Opinion Body
        const body = document.createElement("div");
        body.className = "postit-body";
        body.textContent = op.content;
        card.appendChild(body);
        
        // Comments / Responses Container
        const commentsDiv = document.createElement("div");
        commentsDiv.className = "postit-comments";
        
        // Comments Label
        const commentsLabel = document.createElement("div");
        commentsLabel.className = "comments-label";
        commentsLabel.innerHTML = `<i data-lucide="message-square" style="width: 14px; height: 14px;"></i> 반론 및 댓글 (${op.comments.length})`;
        commentsDiv.appendChild(commentsLabel);
        
        // Individual Comment Items
        op.comments.forEach(comment => {
            const commentItem = document.createElement("div");
            commentItem.className = "comment-item";
            commentItem.innerHTML = `<strong>💬</strong> ${comment}`;
            commentsDiv.appendChild(commentItem);
        });
        
        // Comment Input Form (Conditional based on auth)
        const commentForm = document.createElement("form");
        commentForm.className = "comment-form";
        commentForm.onsubmit = (e) => {
            e.preventDefault();
            const input = commentForm.querySelector("input");
            const val = input.value.trim();
            if (val) {
                submitComment(op.id, val);
                input.value = "";
            }
        };
        
        const commentInput = document.createElement("input");
        commentInput.type = "text";
        
        const commentButton = document.createElement("button");
        commentButton.type = "submit";
        commentButton.innerHTML = `<i data-lucide="corner-down-left" style="width: 14px; height: 14px;"></i>`;
        
        // If not logged in as student or authenticated as admin, disable input
        if (state.studentLoggedIn || state.adminAuthenticated) {
            commentInput.placeholder = "반론 작성...";
            commentForm.appendChild(commentInput);
            commentForm.appendChild(commentButton);
        } else {
            commentInput.placeholder = "로그인 후 댓글 작성 가능";
            commentInput.disabled = true;
            commentInput.style.cursor = "pointer";
            commentInput.addEventListener("click", () => {
                switchMode('student');
                document.getElementById("student-id-input").focus();
                showToast("의견을 등록하거나 댓글을 달려면 학번 로그인을 해주세요.", "info");
            });
            commentForm.appendChild(commentInput);
        }
        
        commentsDiv.appendChild(commentForm);
        card.appendChild(commentsDiv);
        
        // Append to correct column
        if (op.type === '찬성') {
            proList.appendChild(card);
            proCount++;
        } else {
            conList.appendChild(card);
            conCount++;
        }
    });
    
    // Update counters
    document.getElementById("pro-count").textContent = proCount;
    document.getElementById("con-count").textContent = conCount;
    
    // Trigger Lucide to render icons inside dynamic components
    lucide.createIcons();
}

// ==========================================================================
// Operations (CRUD / Actions)
// ==========================================================================

// Submit a new post-it opinion
function submitOpinion() {
    if (!state.studentLoggedIn) {
        showToast("학번 로그인 후 이용해 주세요.", "error");
        return;
    }
    
    const reasonInput = document.getElementById("opinion-reason");
    const reason = reasonInput.value.trim();
    
    if (!reason) {
        showToast("이유를 작성하셔야 포스트잇 등록이 가능합니다.", "error");
        return;
    }
    
    const stanceSelector = document.querySelector('input[name="stance"]:checked');
    const stance = stanceSelector ? stanceSelector.value : "찬성";
    
    // Generate new opinion
    const nextId = state.opinions.length > 0 ? Math.max(...state.opinions.map(o => o.id)) + 1 : 1;
    const newOpinion = {
        id: nextId,
        type: stance,
        content: reason,
        comments: [],
        studentId: state.studentId,
        date: new Date().toLocaleDateString()
    };
    
    state.opinions.push(newOpinion);
    saveBoardData();
    renderBoard();
    
    // Reset form
    reasonInput.value = "";
    
    // Auto Scroll to the bottom of the list where the new item is added
    const targetList = stance === '찬성' ? document.getElementById("pro-list") : document.getElementById("con-list");
    setTimeout(() => {
        targetList.scrollTo({
            top: targetList.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
    
    showToast("의견이 익명 포스트잇으로 등록되었습니다.", "success");
}

// Add a comment to an opinion
function submitComment(opinionId, commentText) {
    if (!state.studentLoggedIn && !state.adminAuthenticated) {
        showToast("의견에 대한 반론을 달려면 로그인이 필요합니다.", "error");
        return;
    }
    
    const opinion = state.opinions.find(op => op.id === opinionId);
    if (opinion) {
        opinion.comments.push(commentText);
        saveBoardData();
        renderBoard();
        showToast("반론이 등록되었습니다.", "success");
    }
}

// Teacher function: Update Debate Topic & Clear Board
function updateTopic() {
    if (!state.adminAuthenticated) {
        showToast("교사 관리자 권한이 없습니다.", "error");
        return;
    }
    
    const input = document.getElementById("new-topic-input");
    const newTopic = input.value.trim();
    
    if (!newTopic) {
        showToast("새로운 토론 쟁점을 입력해 주세요.", "error");
        return;
    }
    
    if (confirm("쟁점을 변경하면 기존 등록된 모든 포스트잇이 초기화됩니다. 계속하시겠습니까?")) {
        state.topic = newTopic;
        state.opinions = [];
        saveBoardData();
        
        renderTopic();
        renderBoard();
        showToast("새로운 쟁점이 반영되었으며 토론방이 초기화되었습니다.", "success");
    }
}

// ==========================================================================
// Toast Notification Utility
// ==========================================================================
function showToast(message, type = 'info') {
    const container = document.getElementById("toast-container");
    
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    // Get appropriate icon based on type
    let iconName = "info";
    if (type === "success") iconName = "check-circle";
    if (type === "error") iconName = "alert-circle";
    
    toast.innerHTML = `<i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i><span>${message}</span>`;
    container.appendChild(toast);
    
    // Render icon
    lucide.createIcons();
    
    // Animate removal
    setTimeout(() => {
        toast.style.animation = "toastOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards";
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 3000);
}
