const db = firebase.firestore();
const postsCol = db.collection('posts');

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
    // Data is already in currentPostId, details handled in detail view
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
    postList.innerHTML = '<tr><td colspan="4" style="text-align:center">로딩 중...</td></tr>';
    try {
        const snapshot = await postsCol.orderBy('createdAt', 'desc').get();
        postList.innerHTML = '';
        
        if (snapshot.empty) {
            postList.innerHTML = '<tr><td colspan="4" style="text-align:center">게시물이 없습니다.</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const post = doc.data();
            const date = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : '-';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${doc.id.substring(0, 5)}</td>
                <td class="post-title-cell">${post.title}</td>
                <td>${post.author}</td>
                <td>${date}</td>
            `;
            tr.addEventListener('click', () => viewPost(doc.id));
            postList.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading posts: ", error);
        postList.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">데이터를 불러오는데 실패했습니다. (Firebase 설정을 확인하세요)</td></tr>';
    }
}

async function savePost() {
    const title = document.getElementById('post-title').value;
    const author = document.getElementById('post-author').value;
    const content = document.getElementById('post-content').value;

    if (!title || !author || !content) {
        alert('모든 필드를 입력해주세요.');
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
            alert('수정되었습니다.');
        } else {
            postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await postsCol.add(postData);
            alert('등록되었습니다.');
        }
        showView('list');
    } catch (error) {
        console.error("Error saving post: ", error);
        alert('저장에 실패했습니다.');
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
        document.getElementById('detail-date').innerText = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString() : '-';
        document.getElementById('detail-content').innerText = post.content;

        // Fill form in case of edit
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
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    try {
        await postsCol.doc(currentPostId).delete();
        alert('삭제되었습니다.');
        showView('list');
    } catch (error) {
        console.error("Error deleting post: ", error);
        alert('삭제에 실패했습니다.');
    }
}

// Comments Logic
const btnCommentSubmit = document.getElementById('btn-comment-submit');
btnCommentSubmit.addEventListener('click', addComment);

async function addComment() {
    const author = document.getElementById('comment-author').value;
    const text = document.getElementById('comment-text').value;

    if (!author || !text) {
        alert('댓글 내용과 작성자를 입력하세요.');
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
    }
}

async function loadComments(postId) {
    const commentsList = document.getElementById('comments-list');
    const commentCount = document.getElementById('comment-count');
    commentsList.innerHTML = '로딩 중...';

    try {
        const snapshot = await postsCol.doc(postId).collection('comments').orderBy('createdAt', 'asc').get();
        commentsList.innerHTML = '';
        commentCount.innerText = snapshot.size;

        snapshot.forEach(doc => {
            const comment = doc.data();
            const date = comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleString() : '-';
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${date}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
            `;
            commentsList.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading comments: ", error);
        commentsList.innerHTML = '댓글을 불러올 수 없습니다.';
    }
}

function resetForm() {
    document.getElementById('post-title').value = '';
    document.getElementById('post-author').value = '';
    document.getElementById('post-content').value = '';
}

function showView(view) {
    postListView.style.display = view === 'list' ? 'block' : 'none';
    postDetailView.style.display = view === 'detail' ? 'block' : 'none';
    postFormView.style.display = view === 'form' ? 'block' : 'none';
}
