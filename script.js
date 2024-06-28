const seatContainer = document.querySelector('.seat-container');
const confirmBtn = document.getElementById('confirmBtn');
const cancelContainer = document.getElementById('cancelContainer');
const cancelBtn = document.getElementById('cancelBtn');
const cancelAllBtn = document.getElementById('cancelAllBtn');
cancelAllBtn.addEventListener('click', cancelAllSeats);
const confirmMessage = document.getElementById('confirmMessage');
const seats = [];
let selectedSeats = [];
let cancelTargets = [];
let isCancelContainerVisible = false;
let discountedSeats = [];
let discountedSeatsMap = {};

function createSeats() {
    for (let i = 1; i <= 14 * 11; i++) {
        const seat = document.createElement('div');
        seat.classList.add('seat');
        const row = Math.ceil(i / 11);
        const col = i % 11 || 11;
        seat.textContent = `${row}-${col}`;
        seat.addEventListener('click', toggleSeatSelection);
        seatContainer.appendChild(seat);
        seats.push(seat);
    }
}


// 페이지 로드 시 웹 스토리지에서 확정 좌석 정보 가져오기
window.addEventListener('load', () => {
    const confirmedSeats = JSON.parse(localStorage.getItem('confirmedSeats')) || [];
    const storedDiscountedSeatsMap = JSON.parse(localStorage.getItem('discountedSeatsMap')) || {};
    discountedSeatsMap = storedDiscountedSeatsMap;

    confirmedSeats.forEach(seatIndex => {
        const seat = seats[seatIndex];
        const seatRow = Math.ceil((seatIndex + 1) / 11);
        const seatCol = (seatIndex + 1) % 11 || 11;
        seat.textContent = `${seatRow}-${seatCol}`; // 좌석 번호 표시 업데이트
        seat.classList.add('confirmed');
        if (storedDiscountedSeatsMap[seatIndex]) {
            seat.classList.add('discounted');
        }
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

async function confirmSelectedSeats() {
    const confirmedSeatIndices = [];
    const discountPrompt = document.getElementById('discountPrompt');

    for (const seat of selectedSeats) {
        const seatIndex = seats.indexOf(seat);
        const seatRow = Math.ceil((seatIndex + 1) / 11);
        const seatCol = (seatIndex + 1) % 11 || 11;
        discountPrompt.innerHTML = `
            <div>${seatRow}-${seatCol}번 좌석에 할인권을 사용하시겠습니까?</div>
            <div class="buttons">
                <button class="confirm-btn" disabled>
                    <div class="cooldown-bar"></div>
                    확인
                </button>
                <button class="cancel-btn" disabled>
                    <div class="cooldown-bar"></div>
                    취소
                </button>
            </div>
        `;
        discountPrompt.classList.add('show');

        const useDiscount = new Promise(resolve => {
            let cooldownTimeout;

            const confirmBtn = discountPrompt.querySelector('.confirm-btn');
            const cancelBtn = discountPrompt.querySelector('.cancel-btn');

            const handleConfirm = () => {
                clearTimeout(cooldownTimeout);
                confirmBtn.disabled = false;
                cancelBtn.disabled = false;
                resolve(true);
            };

            const handleCancel = () => {
                clearTimeout(cooldownTimeout);
                confirmBtn.disabled = false;
                cancelBtn.disabled = false;
                resolve(false);
            };

            const startCooldown = () => {
                confirmBtn.disabled = true;
                cancelBtn.disabled = true;
                const cooldownBars = discountPrompt.querySelectorAll('.cooldown-bar');
                cooldownBars.forEach(bar => {
                    bar.style.width = '100%';
                    bar.style.animation = 'cooldown 1s linear forwards';
                });
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            startCooldown();
            cooldownTimeout = setTimeout(() => {
                confirmBtn.disabled = false;
                cancelBtn.disabled = false;
                confirmBtn.querySelector('.cooldown-bar').style.animation = '';
                cancelBtn.querySelector('.cooldown-bar').style.animation = '';
            }, 1000);
        });

        const useDiscountResult = await useDiscount;
        discountPrompt.classList.remove('show');
        discountPrompt.innerHTML = '';

        confirmedSeatIndices.push(seatIndex);

        if (useDiscountResult) {
            discountedSeatsMap[seatIndex] = true;
        }
    }

    const existingConfirmedSeats = JSON.parse(localStorage.getItem('confirmedSeats')) || [];
    const updatedConfirmedSeats = [...existingConfirmedSeats, ...confirmedSeatIndices];

    localStorage.setItem('confirmedSeats', JSON.stringify(updatedConfirmedSeats));
    localStorage.setItem('discountedSeatsMap', JSON.stringify(discountedSeatsMap));

    selectedSeats.forEach(seat => {
        const seatIndex = seats.indexOf(seat);
        seat.classList.add('confirmed');
        if (discountedSeatsMap[seatIndex]) {
            seat.classList.add('discounted');
        }
        seat.classList.remove('selected');
    });

    selectedSeats = [];
    showConfirmMessage('선택한 좌석이 확정되었습니다.');
    updateSeatInfo();
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
        cancelAllBtn.addEventListener('click', cancelAllSeats); // 추가된 코드
    } else {
        seats.forEach(seat => {
            seat.removeEventListener('click', toggleCancelTarget);
        });
        cancelBtn.removeEventListener('click', cancelSelectedSeats);
        cancelAllBtn.removeEventListener('click', cancelAllSeats); // 추가된 코드
    }
}

function cancelAllSeats() {
    const confirmedSeats = JSON.parse(localStorage.getItem('confirmedSeats')) || [];
    const discountedSeatsMap = JSON.parse(localStorage.getItem('discountedSeatsMap')) || {};

    // 확정된 좌석 및 할인권 사용 좌석 모두 취소
    confirmedSeats.forEach(index => {
        const seat = seats[index];
        seat.classList.remove('confirmed', 'cancel-target', 'discounted');
        delete discountedSeatsMap[index];
    });

    localStorage.setItem('confirmedSeats', '[]');
    localStorage.setItem('discountedSeatsMap', '{}');

    selectedSeats = [];
    cancelTargets = [];
    showConfirmMessage('모든 좌석이 취소되었습니다.');
    updateSeatInfo();
}


function toggleCancelTarget() {
    if (this.classList.contains('confirmed') || this.classList.contains('discounted')) {
        if (this.classList.contains('cancel-target')) {
            this.classList.remove('cancel-target');
            cancelTargets = cancelTargets.filter(seat => seat !== this);
        } else {
            this.classList.add('cancel-target');
            cancelTargets.push(this);
        }
    }
}


function cancelSelectedSeats() {
    const cancelledSeatIndices = cancelTargets.map(seat => seats.indexOf(seat));
    const confirmedSeats = JSON.parse(localStorage.getItem('confirmedSeats')) || [];
    const updatedConfirmedSeats = confirmedSeats.filter(index => !cancelledSeatIndices.includes(index));
    localStorage.setItem('confirmedSeats', JSON.stringify(updatedConfirmedSeats));

    // 할인권 사용 정보 제거
    cancelledSeatIndices.forEach(index => {
        delete discountedSeatsMap[index];
    });
    localStorage.setItem('discountedSeatsMap', JSON.stringify(discountedSeatsMap));

    cancelTargets.forEach(seat => {
        seat.classList.remove('confirmed', 'cancel-target', 'discounted');
    });
    cancelTargets = [];
    showConfirmMessage('선택한 좌석이 취소되었습니다.');
    updateSeatInfo();
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

function updateSeatInfo() {
    const remainingSeats = seats.filter(seat => !seat.classList.contains('confirmed')).length;
    const totalSeats = seats.length;
    const totalAudience = totalSeats - remainingSeats;

    document.getElementById('remainingSeats').textContent = remainingSeats;
    document.getElementById('totalSeats').textContent = totalSeats;
    document.getElementById('totalAudience').textContent = totalAudience;
}
