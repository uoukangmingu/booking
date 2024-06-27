const seatContainer = document.querySelector('.seat-container');
const confirmBtn = document.getElementById('confirmBtn');
const cancelContainer = document.getElementById('cancelContainer');
const cancelBtn = document.getElementById('cancelBtn');
const confirmMessage = document.getElementById('confirmMessage');
const seats = [];
let selectedSeats = [];
let cancelTargets = [];
let isCancelContainerVisible = false;

function createSeats() {
    for (let i = 1; i <= 14 * 11; i++) {
        const seat = document.createElement('div');
        seat.classList.add('seat');
        seat.textContent = `${Math.ceil(i / 11)}-${i % 11 || 11}`;
        seat.addEventListener('click', toggleSeatSelection);
        seatContainer.appendChild(seat);
        seats.push(seat);
    }
}

// 페이지 로드 시 웹 스토리지에서 확정 좌석 정보 가져오기
window.addEventListener('load', () => {
    const confirmedSeats = JSON.parse(localStorage.getItem('confirmedSeats')) || [];
    confirmedSeats.forEach(seatIndex => {
        const seat = seats[seatIndex];
        seat.classList.add('confirmed');
    });
});

function toggleSeatSelection() {
    if (this.classList.contains('confirmed')) return;
    this.classList.toggle('selected');
    const index = selectedSeats.indexOf(this);
    if (index === -1) {
        selectedSeats.push(this);
    } else {
        selectedSeats.splice(index, 1);
    }
}

function confirmSelectedSeats() {
    const confirmedSeatIndices = selectedSeats.map(seat => seats.indexOf(seat));
    const existingConfirmedSeats = JSON.parse(localStorage.getItem('confirmedSeats')) || [];
    const updatedConfirmedSeats = [...existingConfirmedSeats, ...confirmedSeatIndices];
    localStorage.setItem('confirmedSeats', JSON.stringify(updatedConfirmedSeats));
    selectedSeats.forEach(seat => {
        seat.classList.add('confirmed');
        seat.classList.remove('selected');
    });
    selectedSeats = [];
    showConfirmMessage('선택한 좌석이 확정되었습니다.');
}


function toggleCancelContainer() {
    isCancelContainerVisible = !isCancelContainerVisible;
    cancelContainer.style.display = isCancelContainerVisible ? 'flex' : 'none';
    cancelBtn.disabled = !isCancelContainerVisible;

    if (isCancelContainerVisible) {
        seats.forEach(seat => {
            seat.addEventListener('click', toggleCancelTarget);
        });
        cancelBtn.addEventListener('click', cancelSelectedSeats);
    } else {
        seats.forEach(seat => {
            seat.removeEventListener('click', toggleCancelTarget);
        });
        cancelBtn.removeEventListener('click', cancelSelectedSeats);
    }
}

function toggleCancelTarget() {
    if (this.classList.contains('confirmed')) {
        this.classList.add('cancel-target');
        cancelTargets.push(this);
    } else if (this.classList.contains('cancel-target')) {
        this.classList.remove('cancel-target');
        cancelTargets = cancelTargets.filter(seat => seat !== this);
    }
}

function cancelSelectedSeats() {
    const cancelledSeatIndices = cancelTargets.map(seat => seats.indexOf(seat));
    const confirmedSeats = JSON.parse(localStorage.getItem('confirmedSeats')) || [];
    const updatedConfirmedSeats = confirmedSeats.filter(index => !cancelledSeatIndices.includes(index));
    localStorage.setItem('confirmedSeats', JSON.stringify(updatedConfirmedSeats));
    cancelTargets.forEach(seat => {
        seat.classList.remove('confirmed', 'cancel-target');
    });
    cancelTargets = [];
    showConfirmMessage('선택한 좌석이 취소되었습니다.');
}

function showConfirmMessage(message) {
    confirmMessage.textContent = message;
    confirmMessage.classList.add('show');
    setTimeout(() => {
        confirmMessage.classList.remove('show');
    }, 3000);
}

document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'b') {
        toggleCancelContainer();
    }
});

createSeats();

confirmBtn.addEventListener('click', confirmSelectedSeats);
