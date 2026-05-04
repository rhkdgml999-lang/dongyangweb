// firebase-config.js에서 초기화된 firebase 객체를 사용합니다.
const postsCol = firebase.firestore().collection('posts');

// DOM Elements
const postListView = document.getElementById('board-list-view');
const postDetailView = document.getElementById('post-detail-view');
const postFormView = document.getElementById('post-form-view');
const postList = document.getElementById('post-list');

const btnWrite = document.getElementById('btn-write');
const btnSave = document.getElementById('btn-save');
const btnEdit = document.getElementById('btn-edit');
const btnDelete = document.getElementById('btn-delete');
const btnBacks = document.querySelectorAll('.btn-back');

let currentPostId = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log("Board Page Loaded");
    loadPosts();
});

// Event Listeners
btnWrite.addEventListener('click', () => {
    showView('form');
    resetForm();
    document.getElementById('form-title').innerText = '새 글 작성';
    currentPostId = null;
});

btnSave.addEventListener('click', savePost);

btnEdit.addEventListener('click', () => {
    showView('form');
    document.getElementById('form-title').innerText = '글 수정';
});

btnDelete.addEventListener('click', deletePost);

btnBacks.forEach(btn => {
    btn.addEventListener('click', () => showView('list'));
});

// View Switching
function showView(view) {
    postListView.style.display = view === 'list' ? 'block' : 'none';
    postDetailView.style.display = view === 'detail' ? 'block' : 'none';
    postFormView.style.display = view === 'form' ? 'block' : 'none';
    
    if (view === 'list') {
        loadPosts();
    }
}

// Data Functions
async function loadPosts() {
    postList.innerHTML = '<tr><td colspan="4" style="text-align:center">데이터를 불러오는 중...</td></tr>';
    try {
        const snapshot = await postsCol.orderBy('createdAt', 'desc').get();
        postList.innerHTML = '';
        
        if (snapshot.empty) {
            postList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px 0; color: #999;">게시물이 없습니다. 첫 글을 작성해보세요!</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const post = doc.data();
            const date = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : '방금 전';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:#999; font-size: 0.8rem;">${doc.id.substring(0, 5)}</td>
                <td style="font-weight: 600;">${post.title}</td>
                <td>${post.author}</td>
                <td style="color:#888;">${date}</td>
            `;
            tr.addEventListener('click', () => viewPost(doc.id));
            postList.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading posts: ", error);
        postList.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ff4d4f; padding: 20px;">
            데이터 로드 실패: ${error.message}<br>
            (파이어베이스 보안 규칙을 확인해주세요)
        </td></tr>`;
    }
}

async function savePost() {
    console.log("Saving post...");
    const title = document.getElementById('post-title').value.trim();
    const author = document.getElementById('post-author').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if (!title || !author || !content) {
        alert('모든 항목을 입력해주세요.');
        return;
    }

    const postData = {
        title,
        author,
        content,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (currentPostId) {
            await postsCol.doc(currentPostId).update(postData);
            console.log("Update success");
            alert('수정되었습니다.');
        } else {
            postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await postsCol.add(postData);
            console.log("Add success");
            alert('등록되었습니다.');
        }
        showView('list');
    } catch (error) {
        console.error("FIREBASE SAVE ERROR:", error);
        alert(`저장에 실패했습니다: ${error.message}\n\n콘솔(F12)을 확인하여 상세한 에러 내용을 체크해주세요.`);
    }
}

async function viewPost(id) {
    currentPostId = id;
    try {
        const doc = await postsCol.doc(id).get();
        if (!doc.exists) return;

        const post = doc.data();
        document.getElementById('detail-title').innerText = post.title;
        document.getElementById('detail-author').innerText = post.author;
        document.getElementById('detail-date').innerText = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString() : '방금 전';
        document.getElementById('detail-content').innerText = post.content;

        // Form fields pre-fill for edit
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-author').value = post.author;
        document.getElementById('post-content').value = post.content;

        showView('detail');
        loadComments(id);
    } catch (error) {
        console.error("Error viewing post: ", error);
    }
}

async function deletePost() {
    if (!confirm('문서를 삭제하시겠습니까?')) return;
    try {
        await postsCol.doc(currentPostId).delete();
        alert('삭제되었습니다.');
        showView('list');
    } catch (error) {
        console.error("Error deleting post: ", error);
        alert('삭제 실패: ' + error.message);
    }
}

// Comments
const btnCommentSubmit = document.getElementById('btn-comment-submit');
if (btnCommentSubmit) {
    btnCommentSubmit.addEventListener('click', addComment);
}

async function addComment() {
    const author = document.getElementById('comment-author').value.trim();
    const text = document.getElementById('comment-text').value.trim();

    if (!author || !text) {
        alert('작성자와 내용을 입력하세요.');
        return;
    }

    try {
        await postsCol.doc(currentPostId).collection('comments').add({
            author,
            text,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('comment-text').value = '';
        loadComments(currentPostId);
    } catch (error) {
        console.error("Error adding comment: ", error);
        alert('댓글 등록 실패: ' + error.message);
    }
}

async function loadComments(postId) {
    const commentsList = document.getElementById('comments-list');
    const commentCount = document.getElementById('comment-count');
    commentsList.innerHTML = '<div style="padding: 10px;">댓글 로딩 중...</div>';

    try {
        const snapshot = await postsCol.doc(postId).collection('comments').orderBy('createdAt', 'asc').get();
        commentsList.innerHTML = '';
        commentCount.innerText = snapshot.size;

        if (snapshot.empty) {
            commentsList.innerHTML = '<div style="padding: 10px; color:#999; font-size:0.9rem;">등록된 댓글이 없습니다.</div>';
            return;
        }

        snapshot.forEach(doc => {
            const comment = doc.data();
            const date = comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleString() : '방금 전';
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-header" style="margin-bottom: 5px;">
                    <span class="comment-author" style="font-weight: 700; font-size: 0.9rem;">${comment.author}</span>
                    <span class="comment-date" style="font-size: 0.75rem; color:#999; margin-left: 10px;">${date}</span>
                </div>
                <div class="comment-text" style="font-size: 0.9rem; color:#444;">${comment.text}</div>
            `;
            commentsList.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading comments: ", error);
        commentsList.innerHTML = '<div style="color:red;">댓글 로드 실패</div>';
    }
}

function resetForm() {
    document.getElementById('post-title').value = '';
    document.getElementById('post-author').value = '';
    document.getElementById('post-content').value = '';
}
