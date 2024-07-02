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
let prohibitedSeats = [];

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
    toggleCancelContainer();
    updateSeatInfo();
});


function toggleSeatSelection() {
    if (this.classList.contains('confirmed')) return;

    if (event.ctrlKey) {
        // Ctrl 키를 누른 상태에서 클릭한 경우
        if (this.classList.contains('prohibited')) {
            // 금지 좌석인 경우, 금지를 해제
            this.classList.remove('prohibited');
            prohibitedSeats = prohibitedSeats.filter(seat => seat !== this);
        } else {
            // 일반 좌석인 경우, 금지 좌석으로 설정
            this.classList.add('prohibited');
            prohibitedSeats.push(this);
        }
    } else {
        // 일반적인 좌석 선택/해제 로직
        this.classList.toggle('selected');
        const index = selectedSeats.indexOf(this);
        if (index === -1) {
            selectedSeats.push(this);
        } else {
            selectedSeats.splice(index, 1);
        }
    }
}


async function confirmSelectedSeats() {
    const confirmedSeatIndices = [];
    const discountPrompt = document.getElementById('discountPrompt');

    for (const seat of selectedSeats) {
        if (seat.classList.contains('prohibited')) continue;
        const seatIndex = seats.indexOf(seat);
        const seatRow = Math.ceil((seatIndex + 1) / 11);
        const seatCol = (seatIndex + 1) % 11 || 11;
        discountPrompt.innerHTML = `
            <div>${seatRow}-${seatCol}번 좌석에 할인권을 사용하시겠습니까?</div>
            <div class="buttons">
                <button class="confirm-btn" disabled>
                    <div class="cooldown-bar"></div>
                    사용
                </button>
                <button class="cancel-btn" disabled>
                    <div class="cooldown-bar"></div>
                    미사용
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
                    bar.style.animation = 'cooldown 0.9s linear forwards';
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
            }, 900);
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
    const remainingSeats = seats.filter(seat => !seat.classList.contains('confirmed') && !seat.classList.contains('prohibited')).length;
    const totalSeats = seats.length - prohibitedSeats.length;
    const totalAudience = totalSeats - remainingSeats;
    const discountedSeatsCount = seats.filter(seat => seat.classList.contains('discounted')).length;

    document.getElementById('remainingSeats').textContent = remainingSeats;
    document.getElementById('totalSeats').textContent = totalSeats;
    document.getElementById('totalAudience').textContent = totalAudience;
    document.getElementById('discountedSeatsCount').textContent = `(할인권 사용: ${discountedSeatsCount}석)`;
}

const stage = document.querySelector('.stage');

stage.addEventListener('click', () => {
    prohibitedSeats.forEach(seat => {
        seat.classList.remove('prohibited');
    });
    prohibitedSeats = [];
});


const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const container = document.querySelector('.container');

let currentZoom = 1;
const maxZoom = 2;
const minZoom = 0.5;
const zoomStep = 0.05;

zoomInBtn.addEventListener('click', () => {
  if (currentZoom < maxZoom) {
    currentZoom += zoomStep;
    container.style.transform = `scale(${currentZoom})`;
  }
});

zoomOutBtn.addEventListener('click', () => {
  if (currentZoom > minZoom) {
    currentZoom -= zoomStep;
    container.style.transform = `scale(${currentZoom})`;
  }
});

// 전체화면 토글 함수
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// 버튼 클릭 이벤트 리스너
const fullscreenBtn = document.getElementById('fullscreenBtn');
fullscreenBtn.addEventListener('click', toggleFullScreen);

const darkModeBtn = document.getElementById('darkModeBtn');
const body = document.body;

darkModeBtn.addEventListener('click', toggleDarkMode);

function toggleDarkMode() {
  body.classList.toggle('dark-mode');
}



let isReserving = false;
let reservingSeats = [];

seats.forEach(seat => {
  seat.addEventListener('click', handleSeatClick);
});

function handleSeatClick(e) {
  const seat = e.target;
  if (isReserving && e.shiftKey) {
    if (!seat.classList.contains('reserved') && !seat.classList.contains('confirmed')) {
      seat.classList.add('reserving');
      reservingSeats.push(seat);
    }
  } else {
    reservingSeats.forEach(reservingSeat => {
      reservingSeat.classList.remove('reserving');
      reservingSeat.classList.add('reserved');
    });
    reservingSeats = [];
    isReserving = false;
  }
}

document.addEventListener('keydown', e => {
  if (e.shiftKey) {
    isReserving = true;
  }
});

document.addEventListener('keyup', e => {
  if (e.key === 'Shift') {
    isReserving = false;
    reservingSeats.forEach(reservingSeat => {
      reservingSeat.classList.remove('reserving');
      reservingSeat.classList.add('reserved');
    });
    reservingSeats = [];
  }
});



// 단축키 이벤트 핸들러
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f') {
    document.getElementById('reservationInfoModal').style.display = 'block';
  }
});

// 예약자 정보 입력 모달 닫기 버튼 클릭 이벤트 핸들러
var closeButtons = document.getElementsByClassName('close');
for (var i = 0; i < closeButtons.length; i++) {
  closeButtons[i].addEventListener('click', function() {
    document.getElementById('reservationInfoModal').style.display = 'none';
  });
}

// 예약자 정보 입력 모달 외부 클릭 시 닫기
window.addEventListener('click', function(event) {
  var modal = document.getElementById('reservationInfoModal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }
});

// 예약자 정보 저장 배열
var reservedPhoneNumbers = [];

// 예약자 정보 입력 폼 제출 이벤트 핸들러
document.getElementById('reservationInfoForm').addEventListener('submit', function(event) {
  event.preventDefault(); // 기본 폼 제출 동작 방지

  // 휴대전화 뒷번호 4자리 입력값 가져오기
  var phoneLastFour = document.getElementById('phoneLastFour').value;

  // 유효성 검사 (숫자 4자리인지 확인)
  if (phoneLastFour.length !== 4 || isNaN(phoneLastFour)) {
    alert('휴대전화 뒷번호 4자리를 정확히 입력해주세요.');
    return;
  }

  // 예약자 정보 저장
  reservedPhoneNumbers.push(phoneLastFour);

  // 예약자 정보 표시
  displayReservedPhoneNumbers();

  // 입력값 초기화
  document.getElementById('phoneLastFour').value = '';
});


// 예약자 정보 표시 함수
function displayReservedPhoneNumbers() {
  var reservedPhoneNumbersDiv = document.getElementById('reservedPhoneNumbers');
  reservedPhoneNumbersDiv.innerHTML = '';

  for (var i = 0; i < reservedPhoneNumbers.length; i++) {
    var phoneNumberDiv = document.createElement('div');
    phoneNumberDiv.classList.add('phone-number');
    phoneNumberDiv.dataset.index = i; // 인덱스 정보 추가

    var phoneNumberText = document.createElement('span');
    phoneNumberText.textContent = `${i + 1}. ${reservedPhoneNumbers[i]}`;

    var deleteButton = document.createElement('span');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'x';
    deleteButton.addEventListener('click', function() {
      deleteReservedPhoneNumber(this.parentElement.dataset.index);
    });

    phoneNumberDiv.appendChild(phoneNumberText);
    phoneNumberDiv.appendChild(deleteButton);
    reservedPhoneNumbersDiv.appendChild(phoneNumberDiv);
  }
}

// 예약자 정보 삭제 함수
function deleteReservedPhoneNumber(index) {
  reservedPhoneNumbers.splice(index, 1);
  displayReservedPhoneNumbers();
}



// 예약자 정보 입력 모달 닫기 버튼 클릭 이벤트 핸들러
var closeButton = document.querySelector('#reservationInfoModal .close');
closeButton.addEventListener('click', function() {
  document.getElementById('reservationInfoModal').style.display = 'none';
});

// 예약자 정보 입력 모달 외부 클릭 시 닫기
window.addEventListener('click', function(event) {
  var modal = document.getElementById('reservationInfoModal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }
});


// 예약자 정보 처리 함수 (추후 구현 필요)
function processReservationInfo(phoneLastFour) {
  // 예약자 정보 처리 로직 구현
  console.log('예약자 휴대전화 뒷번호:', phoneLastFour);
}
