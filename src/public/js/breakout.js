/**
 * Breakout Rooms Client Script
 * Xử lý giao diện breakout rooms (phòng nhỏ chia nhóm)
 * - Host tạo và quản lý breakout rooms
 * - Participants tham gia phòng nhỏ
 * - API communication
 */

if (typeof socket === 'undefined') {
    console.error('Socket.io not loaded');
}

// ============================================
// API Communication Layer
// ============================================

// Tạo breakout rooms mới
async function apiCreateBreakoutRooms(numRooms) {
    try {
        const response = await fetch(`/api/meeting/${meetingId}/breakout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ numRooms })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create breakout rooms');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating breakout rooms:', error);
        alert('Failed to create breakout rooms: ' + error.message);
        throw error;
    }
}

async function apiJoinBreakoutRoom(roomId) {
    try {
        const response = await fetch(`/api/meeting/${meetingId}/breakout/${roomId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to join breakout room');
        }

        return await response.json();
    } catch (error) {
        console.error('Error joining breakout room:', error);
        alert('Failed to join breakout room: ' + error.message);
        throw error;
    }
}

async function apiLeaveBreakoutRoom() {
    try {
        const response = await fetch(`/api/meeting/${meetingId}/breakout/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to leave breakout room');
        }

        return await response.json();
    } catch (error) {
        console.error('Error leaving breakout room:', error);
        alert('Failed to leave breakout room: ' + error.message);
        throw error;
    }
}

// UI Functions

document.getElementById('create-breakout')?.addEventListener('click', () => {
    if (isHost || isCoHost) {
        showCreateBreakoutModal();
    }
});

function showCreateBreakoutModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Create Breakout Rooms</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Number of Rooms</label>
                        <input type="number" class="form-control" id="num-rooms" min="2" max="20" value="4">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" id="create-breakout-submit">Create</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Attach submit handler
    const submitBtn = modal.querySelector('#create-breakout-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const numRooms = parseInt(document.getElementById('num-rooms').value);
            if (numRooms >= 2 && numRooms <= 20) {
                try {
                    await apiCreateBreakoutRooms(numRooms);
                    const instance = bootstrap.Modal.getInstance(modal);
                    if (instance) instance.hide();
                } catch (error) {
                    // Error already shown
                }
            } else {
                alert('Please enter a number between 2 and 20');
            }
        });
    }

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

function showBreakoutRooms(rooms) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'breakoutRoomsModal';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Breakout Rooms</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${rooms.map(room => `
                        <div class="card mb-2">
                            <div class="card-body">
                                <h6>${room.name}</h6>
                                <button class="btn btn-sm btn-primary join-breakout-btn" data-room-id="${room.id}">Join</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Attach join handlers
    modal.querySelectorAll('.join-breakout-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const roomId = btn.dataset.roomId;
            try {
                await apiJoinBreakoutRoom(roomId);
                const instance = bootstrap.Modal.getInstance(modal);
                if (instance) instance.hide();
            } catch (error) {
                // Error already shown
            }
        });
    });

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// ============================================
// Socket Event Listeners (Real-time Updates)
// ============================================

if (typeof socket !== 'undefined') {
    socket.on('breakout-created', ({ rooms }) => {
        console.log('Received breakout-created:', rooms);
        showBreakoutRooms(rooms);
    });

    socket.on('user-joined-breakout', ({ userId, roomId }) => {
        console.log('User joined breakout room:', userId, roomId);
        // Update UI if needed
    });

    socket.on('user-left-breakout', ({ userId }) => {
        console.log('User left breakout room:', userId);
        // Update UI if needed
    });
}

