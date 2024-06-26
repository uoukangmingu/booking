const seatContainer = document.querySelector('.seat-container');
const resetBtn = document.getElementById('reset-btn');
const saveBtn = document.getElementById('save-btn');
const reservationInfo = document.getElementById('reservation-info');
const reservationList = document.getElementById('reservation-list');
const adminBtn = document.getElementById('admin-btn');

let seats = [];
let selectedSeats = [];
let reservations = [];

// 좌석 번호 생성 함수
function createSeatNumber(row, number) {
    return `${row}-${String(number).padStart(2, '0')}`;
}

// 좌석 div 생성 함수
function createSeatDiv(seatNumber, isAvailable) {
    const seatDiv = document.createElement('div');
    seatDiv.className = `seat ${isAvailable ? 'available' : 'unavailable'}`;
    seatDiv.textContent = seatNumber;
    seatDiv.addEventListener('click', selectSeat);
    return seatDiv;
}

// 좌석 배치
for (let row = 4; row <= 14; row++) {
    const rowLetter = `B${row}`;

    for (let number = 1; number <= 11; number++) {
        const seatNumber = createSeatNumber(rowLetter, number);
        const isAvailable = true; // 모든 좌석을 선택 가능으로 설정
        const seatDiv = createSeatDiv(seatNumber, isAvailable);
        seatContainer.appendChild(seatDiv);
        seats.push(seatDiv);
    }
}

// 좌석 선택 함수
function selectSeat(event) {
    const seatDiv = event.target;
    if (seatDiv.classList.contains('available')) {
        seatDiv.classList.remove('available');
        seatDiv.classList.add('selected');
        selectedSeats.push(seatDiv.textContent);
        saveBtn.disabled = false;
    } else if (seatDiv.classList.contains('selected')) {
        seatDiv.classList.remove('selected');
        seatDiv.classList.add('available');
        selectedSeats = selectedSeats.filter(seat => seat !== seatDiv.textContent);
        if (selectedSeats.length === 0) {
            saveBtn.disabled = true;
        }
    }
}

// 초기화 버튼 클릭 이벤트
resetBtn.addEventListener('click', () => {
    seats.forEach(seat => {
        seat.classList.remove('selected');
        seat.classList.add('available');
    });
    selectedSeats = [];
    saveBtn.disabled = true;
    reservationList.innerHTML = ''; 
    reservations = []; // 예약 내역 배열 비우기
    localStorage.removeItem('reservations'); // localStorage에서 예약 내역 삭제
});

// 저장하기 버튼 클릭 이벤트
saveBtn.addEventListener('click', () => {
    const name = prompt('이름을 입력해주세요.');
    if (name) {
        const reservation = { name, seats: selectedSeats };
        reservations.push(reservation);
        updateReservationList();
        resetSeats();
    }
});

// 예약 정보 업데이트 함수
function updateReservationList() {
    reservationList.innerHTML = '';
    reservations.forEach(reservation => {
        const li = document.createElement('li');
        li.textContent = `${reservation.name} - 좌석: ${reservation.seats.join(', ')}`;
        reservationList.appendChild(li);
    });
    reservationInfo.classList.remove('hidden');
}

// 좌석 초기화 함수
function resetSeats() {
    seats.forEach(seat => {
        seat.classList.remove('selected');
        seat.classList.add('available');
    });
    selectedSeats = [];
    saveBtn.disabled = true;
}

// 관리자 모드 버튼 클릭 이벤트
adminBtn.addEventListener('click', () => {
    const password = prompt('관리자 비밀번호를 입력해주세요.');
    if (password === 'admin123') {
        const action = prompt('1. 예약 정보 수정, 2. 예약 정보 삭제');
        if (action === '1') {
            const name = prompt('수정할 예약자 이름을 입력해주세요.');
            const reservation = reservations.find(r => r.name === name);
            if (reservation) {
                const newSeats = prompt(`새로운 좌석 번호를 입력해주세요. (예: A1-01, B2-05)`);
                reservation.seats = newSeats.split(',').map(seat => seat.trim());
                updateReservationList();
            } else {
                alert('해당 예약자를 찾을 수 없습니다.');
            }
        } else if (action === '2') {
            const name = prompt('삭제할 예약자 이름을 입력해주세요.');
            const index = reservations.findIndex(r => r.name === name);
            if (index !== -1) {
                reservations.splice(index, 1);
updateReservationList();
            } else {
                alert('해당 예약자를 찾을 수 없습니다.');
            }
        }
    } else {
        alert('비밀번호가 잘못되었습니다.');
    }
});

// 데이터 저장 및 로드 함수
function saveData() {
    if (reservations.length > 0) {
        localStorage.setItem('reservations', JSON.stringify(reservations));
    } else {
        localStorage.removeItem('reservations');
    }
}

function loadData() {
    const savedReservations = JSON.parse(localStorage.getItem('reservations'));
    if (savedReservations) {
        reservations = savedReservations;
        updateReservationList();
    }
}

// 페이지 로드 시 데이터 로드
window.addEventListener('load', loadData);

// 페이지 언로드 시 데이터 저장
window.addEventListener('beforeunload', saveData);
