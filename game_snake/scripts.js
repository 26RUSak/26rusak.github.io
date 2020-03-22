/**
 * Snake v0.2.1
 * @keshapudelev
 */

// установка урлов для share-ссылок
function shareBtns() {
	const currentPageLink = location.href;
	const vkEl = document.getElementById("vk");
	vkEl.setAttribute("href", `https://vk.com/share.php?url=${currentPageLink}`);

	const fbEl = document.getElementById("fb");
	fbEl.setAttribute(
		"href",
		`https://www.facebook.com/sharer/sharer.php?u=${currentPageLink}`
	);

	const twEl = document.getElementById("tw");
	twEl.setAttribute(
		"href",
		`http://twitter.com/share?text=WebSnake!&url=${currentPageLink}`
	);
}

/*************************
 * ⚙️ Начальные установки
 **************************/

// настройки
const config = {
	// 	начальная длина змейки
	initialLength: 3,
	// 	длительность отображения кадра
	stepDuration: 150,
	// коэффициент уменьшения длительности кадра
	speedMult: 0.95,
	// стоимость еды
	foodScore: 25,
	// делитель баллов для увеличения скорости
	speedUpScoreN: 75,
	// ширина игрового поля
	fieldWidth: 20,
	// высота игрового поля
	fieldHeight: 20,
	// размер ячейки поля
	cellSize: 14
};

// хранение состояний
// текущий статус игры "new" | "play" | "paused" | "stopped"
let gameStatus = "new";
// баллы
let score = 0;
// длина
let length = config.initialLength;
// скорость
let speed = 1;
// координаты еды
let food = [];
// координаты змейки
let snake = [];
// направление движения змейки "up" | "right" | "down" | "left"
let snakeDirection = "right";
// направления джижения каждой части змеи
let snakeChunksDirections = [];
// id таймера смены кадров
let tickId = null;
// текущая длительность показа кадра
let currentStepDuration = config.stepDuration;
// флаг изменения направления на текущем кадре
let directionChanged = false;
// запись направления для следющего шага, если быстро нажато две кнопки подряд
let presetNextDirectionChanged = null;
// переменная для роста змейки
let addTail = null;

let lastScores = [];
let bestScore;

// елементы DOM-дерева
// блок-обёртка для игровой области
const gameEl = document.getElementById("game");
// блок отображения числа баллов
const scoreEl = document.getElementById("score");
// блок отображения текущей скорости
const speedEl = document.getElementById("speed");
// блок отображения текущей длины
const lengthEl = document.getElementById("length");
// блок лучшего результата
const bestScoreEl = document.getElementById("best-block");
// блок числа лучшего результата
const bestScoreNumberEl = document.getElementById("best-score");
// блок последних результатов
const lastScoresEl = document.getElementById("last-block");
// блок списка последних результатов
const lastScoresListEl = document.getElementById("last-scores");
// кнопка "New game"
const newGameEl = document.getElementById("new");
// кнопка "Play"
const playGameEl = document.getElementById("play");
// кнопка "Pause"
const pauseGameEl = document.getElementById("pause");

// создание поля игры
function initField() {
	const fieldEl = document.createElement("div");
	fieldEl.classList.add("field");
	fieldEl.setAttribute(
		"style",
		`width: ${config.cellSize * config.fieldWidth}px; height: ${config.cellSize *
			config.fieldHeight}px;`
	);

	for (i = 0; i < config.fieldWidth; i++) {
		for (j = 0; j < config.fieldHeight; j++) {
			const cellEl = document.createElement("div");
			cellEl.classList.add("cell");
			cellEl.setAttribute("id", `${i}.${j}`);
			cellEl.setAttribute(
				"style",
				`width: ${config.cellSize}px; height: ${config.cellSize}px;`
			);
			fieldEl.append(cellEl);
		}
	}

	gameEl.innerHTML = "";
	gameEl.append(fieldEl);
}

// стирание линеек
function clearRules() {
	const rulesCellEls = document.querySelectorAll(".rules");
	for (element of rulesCellEls) {
		if (element) {
			element.classList.remove("rules");
		}
	}
}

// рисование линеек для прицеливания
function drawRules(coords) {
	clearRules();
	for (i = 0; i < config.fieldWidth; i++) {
		const cell = document.getElementById(`${i}.${coords[0]}`);
		cell.classList.add("rules");
	}
	for (i = 0; i < config.fieldHeight; i++) {
		const cell = document.getElementById(`${coords[1]}.${i}`);
		cell.classList.add("rules");
	}
}

/********************
 * 🍏 Еда
 ********************/

// создаем еду
function createFood() {
	let x;
	let y;
	let notOnSnake = true;
	while (notOnSnake) {
		x = Math.floor(Math.random() * config.fieldWidth);
		y = Math.floor(Math.random() * config.fieldHeight);
		notOnSnake = checkIfOnSnake([x, y]);
	}
	if (food[0]) {
		clearFood();
	}
	food = [x, y];
	drawFood();
}

// удаление еды
function clearFood() {
	const foodCellEls = document.querySelectorAll(".food");
	for (element of foodCellEls) {
		if (element) {
			element.classList.remove("food");
		}
	}
}

// рисование еды
function drawFood() {
	clearFood();
	const cellFoodEl = document.getElementById(`${food[1]}.${food[0]}`);
	if (cellFoodEl) {
		cellFoodEl.classList.add("food");
		const oldStyle = cellFoodEl.getAttribute("style");
		cellFoodEl.setAttribute(
			"style",
			`font-size: ${config.cellSize}px; line-height: ${config.cellSize}px; ${oldStyle}`
		);
	}
}

// поедание еды
function eatFood() {
	score = score + config.foodScore;
	food = [];
	createFood();
	scoreEl.innerHTML = score;
	length++;
	lengthEl.innerHTML = length;

	if (score > 0 && score % config.speedUpScoreN === 0) {
		speed++;
		speedEl.innerHTML = speed;
		clearInterval(tickId);
		tickId = null;
		currentStepDuration = currentStepDuration * config.speedMult;
		tick();
	}
}

/********************
 * 🐍 Змейка
 ********************/

// инициализация змейки
function initSnake() {
	const newSnake = snake.slice();
	const newSnakeChunksDirections = snakeChunksDirections.slice();

	const initialY = Math.floor(config.fieldHeight / 2);
	const initialX = 0;

	for (i = 0; i < config.initialLength; i++) {
		newSnake.push([initialX + i, initialY]);
		newSnakeChunksDirections.push("right");
	}

	snake = newSnake.slice().reverse();
	snakeChunksDirections = newSnakeChunksDirections.slice().reverse();
}

// стирание змейки
function clearSnake() {
	const snakeCellEls = document.querySelectorAll(".snake");
	for (chunk of snakeCellEls) {
		if (chunk) {
			chunk.classList.remove(
				"snake",
				"snake-h",
				"snake-v",
				"snake-corner-left-up",
				"snake-corner-left-down",
				"snake-corner-right-up",
				"snake-corner-right-down",
				"head-up",
				"head-down",
				"head-left",
				"head-right",
				"last-chunk-up",
				"last-chunk-down",
				"last-chunk-left",
				"last-chunk-right"
			);
		}
	}
}

// рисование змейки
function drawSnake() {
	const drawingSnake = snake.slice();
	if (
		drawingSnake[0][0] > config.fieldWidth ||
		drawingSnake[0][1] > config.fieldHeight
	) {
		return false;
	}
	clearSnake();

	drawRules(drawingSnake[0]);
	
	for (i = 0; i < drawingSnake.length; i++) {
		const x = drawingSnake[i][0];
		const y = drawingSnake[i][1];
		const snakeCellEl = document.getElementById(`${y}.${x}`);
		if (snakeCellEl) {
			snakeCellEl.classList.add("snake");
			if (
				snakeChunksDirections[i] === "right" ||
				snakeChunksDirections[i] === "left"
			) {
				snakeCellEl.classList.add(`snake-h`);
			} else if (
				snakeChunksDirections[i] === "up" ||
				snakeChunksDirections[i] === "down"
			) {
				snakeCellEl.classList.add(`snake-v`);
			}
			if (i > 0 || i < snake.length - 1) {
				if (snakeChunksDirections[i] !== snakeChunksDirections[i + 1]) {
					if (
						(snakeChunksDirections[i] === "right" &&
							snakeChunksDirections[i + 1] === "up") ||
						(snakeChunksDirections[i] === "down" &&
							snakeChunksDirections[i + 1] === "left")
					) {
						snakeCellEl.classList.add(`snake-corner-right-down`);
					} else
					if (
						(snakeChunksDirections[i] === "right" &&
							snakeChunksDirections[i + 1] === "down") ||
						(snakeChunksDirections[i] === "up" &&
							snakeChunksDirections[i + 1] === "left")
					) {
						snakeCellEl.classList.add(`snake-corner-right-up`);
					} else
					if (
						(snakeChunksDirections[i] === "left" &&
							snakeChunksDirections[i + 1] === "down") ||
						(snakeChunksDirections[i] === "up" &&
							snakeChunksDirections[i + 1] === "right")
					) {
						snakeCellEl.classList.add(`snake-corner-left-up`);
					} else
					if (
						(snakeChunksDirections[i] === "left" &&
							snakeChunksDirections[i + 1] === "up") ||
						(snakeChunksDirections[i] === "down" &&
							snakeChunksDirections[i + 1] === "right")
					) {
						snakeCellEl.classList.add(`snake-corner-left-down`);
					}
				}
			}
			if (i === 0) {
				snakeCellEl.classList.add(`head-${snakeDirection}`);
			}
			if (i === drawingSnake.length - 1) {
				snakeCellEl.classList.add(`last-chunk-${snakeChunksDirections[i]}`);
			}
		}
	}
}

// смена направлений кусков змеи
function snakeChangeChunksDirections() {
	let movedSnakeChunksDirections = snakeChunksDirections.slice();
	for (i = 0; i < movedSnakeChunksDirections.length - 1; i++) {
		const index = movedSnakeChunksDirections.length - 1 - i;
		movedSnakeChunksDirections[index] = movedSnakeChunksDirections[index - 1];
	}

	snakeChunksDirections = movedSnakeChunksDirections.slice();
}

// сдвиг змейки
function moveSnake() {
	let movedSnake = snake.slice();
	const currentSnakeChunksDirections = snakeChunksDirections.slice();
	for (i = 0; i < movedSnake.length; i++) {
		const direction = currentSnakeChunksDirections[i];
		let chunk = movedSnake[i];
		if (direction == "up") {
			chunk = [chunk[0], chunk[1] - 1];
		}
		if (direction == "down") {
			chunk = [chunk[0], chunk[1] + 1];
		}
		if (direction == "left") {
			chunk = [chunk[0] - 1, chunk[1]];
		}
		if (direction == "right") {
			chunk = [chunk[0] + 1, chunk[1]];
		}
		movedSnake[i] = chunk;
	}
	snake = movedSnake.slice();
}

// записываем увеличение хвоста
function willGrowSnake() {
	let oldSnakeTail = snake.slice(-1)[0];
	let oldSnakeTailDirection = snakeChunksDirections.slice(-1)[0];
	addTail = {
		coords: oldSnakeTail,
		direction: oldSnakeTailDirection
	};
}

// реализовываем увеличение хвоста
function growSnake() {
	let newSnake = snake.slice();
	let newSnakeChunksDirection = snakeChunksDirections.slice();
	newSnake.push(addTail.coords);
	newSnakeChunksDirection.push(addTail.direction);
	addTail = null;
	snake = newSnake.slice();
	snakeChunksDirections = newSnakeChunksDirection.slice();
}

// проверка на коллизию
function ifCollision() {
	const snakeHead = snake.slice(0, 1)[0];
	let nextStepSnakeHead = [];
	const direction = snakeChunksDirections.slice(0, 1);

	const checkIfFood = coords => {
		if (coords[0] === food[0] && coords[1] === food[1]) {
			eatFood();
			willGrowSnake();
		}
	};

	if (direction == "up") {
		nextStepSnakeHead = [snakeHead[0], snakeHead[1] - 1];
		if (nextStepSnakeHead[1] < 0) {
			return true;
		}
		if (checkIfOnSnake(nextStepSnakeHead)) {
			return true;
		}
		checkIfFood(nextStepSnakeHead);
	}

	if (direction == "down") {
		nextStepSnakeHead = [snakeHead[0], snakeHead[1] + 1];
		if (nextStepSnakeHead[1] >= config.fieldHeight) {
			return true;
		}
		if (checkIfOnSnake(nextStepSnakeHead)) {
			return true;
		}
		checkIfFood(nextStepSnakeHead);
	}

	if (direction == "left") {
		nextStepSnakeHead = [snakeHead[0] - 1, snakeHead[1]];
		if (nextStepSnakeHead[0] < 0) {
			return true;
		}
		if (checkIfOnSnake(nextStepSnakeHead)) {
			return true;
		}
		checkIfFood(nextStepSnakeHead);
	}

	if (direction == "right") {
		nextStepSnakeHead = [snakeHead[0] + 1, snakeHead[1]];
		if (nextStepSnakeHead[0] >= config.fieldWidth) {
			return true;
		}
		if (checkIfOnSnake(nextStepSnakeHead)) {
			return true;
		}
		checkIfFood(nextStepSnakeHead);
	}

	return false;
}

/************************
 * 🛠️ Прикладные функции
 *************************/

// проверка координат на совпадение со змейкой
function checkIfOnSnake(coords) {
	for (i = 0; i < snake.length - 1; i++) {
		const chunk = snake[i];
		if (coords[0] === chunk[0] && coords[1] === chunk[1]) {
			return true;
		}
	}
}

// очистка tick
function stopTick() {
	if (tickId) {
		clearInterval(tickId);
		tickId = null;
	}
}

// события после коллизии
function gameOver() {
	updateScoresList();
	drawSnake();
	stopTick();
	gameEl.classList.add("game-over");
	newGameEl.setAttribute("style", "display: inline-block");
	pauseGameEl.setAttribute("style", "display: none");
	playGameEl.setAttribute("style", "display: none");
	gameStatus = "stopped";
}

// апдейт списка баллов
function updateScoresList() {
	lastScores.unshift(score);

	if (score > 0 && (!bestScore || score > bestScore)) {
		bestScore = score;
		bestScoreEl.style.display = "block";
		bestScoreNumberEl.innerHTML = bestScore;
	} else {
		if (!bestScore) bestScoreEl.style.display = "none";
	}

	if (lastScores.length) {
		lastScoresListEl.innerHTML = "";
		lastScoresEl.style.display = "block";
		for (let index = 0; index < lastScores.length; index++) {
			const element = document.createElement("div");
			element.innerHTML = lastScores[index];
			lastScoresListEl.append(element);
		}
	} else {
		lastScoresListEl.innerHTML = "";
		lastScoresEl.style.display = "none";
	}
}

// tick
function tick() {
	if (!tickId) {
		tickId = setInterval(() => {
			if (addTail) {
				growSnake();
			}
			if (
				!directionChanged &&
				presetNextDirectionChanged &&
				canTurn(presetNextDirectionChanged)
			) {
				snakeDirection = presetNextDirectionChanged;
				snakeChunksDirections[0] = snakeDirection;
				directionChanged = true;
			} else {
				if (!directionChanged) {
					presetNextDirectionChanged = false;
				}
				directionChanged = false;
			}
			// setTimeout(() => {
			if (ifCollision()) {
				gameOver();
			} else {
				moveSnake();
				snakeChangeChunksDirections();
				drawSnake();
			}
			// }, currentStepDuration - 20);
		}, currentStepDuration);
	}
}

// события клавиатуры и кнопок
function setListeners() {
	function newGameHandler() {
		setDefaults();
		gameStatus = "new";
		initField();
		initSnake();
		drawSnake();

		newGameEl.setAttribute("style", "display: none");
		playGameEl.setAttribute("style", "display: inline-block");
		pauseGameEl.setAttribute("style", "display: none");
	}
	newGameEl.addEventListener("click", newGameHandler);

	function playGameHandler() {
		if (gameStatus !== "paused") {
			startGame();
		}
		gameStatus = "play";
		tick();
		newGameEl.setAttribute("style", "display: none");
		playGameEl.setAttribute("style", "display: none");
		pauseGameEl.setAttribute("style", "display: inline-block");
	}
	playGameEl.addEventListener("click", playGameHandler);

	function pauseGameHandler() {
		clearInterval(tickId);
		tickId = null;
		gameStatus = "paused";
		newGameEl.setAttribute("style", "display: inline-block");
		playGameEl.setAttribute("style", "display: inline-block");
		pauseGameEl.setAttribute("style", "display: none");
	}
	pauseGameEl.addEventListener("click", pauseGameHandler);

	document.addEventListener("keydown", event => {
		const keyCode = event.keyCode;
		const directions = {
			38: "up",
			87: "up",
			39: "right",
			68: "right",
			40: "down",
			83: "down",
			37: "left",
			65: "left"
		};

		const space = 32;

		if (directions[keyCode]) {
			event.preventDefault();
			if (
				!directionChanged &&
				canTurn(directions[keyCode]) &&
				!presetNextDirectionChanged
			) {
				snakeDirection = directions[keyCode];
				directionChanged = true;
				snakeChunksDirections[0] = snakeDirection;
			} else {
				if (directionChanged) {
					presetNextDirectionChanged = directions[keyCode];
					directionChanged = true;
				}
			}
		} else {
			if (keyCode === space) {
				if (gameStatus === "stopped" || gameStatus === "new") {
					newGameEl.dispatchEvent(new Event("click"));
					setTimeout(() => {
						playGameEl.dispatchEvent(new Event("click"));
					}, 200);
				} else if (gameStatus === "play") {
					pauseGameEl.dispatchEvent(new Event("click"));
				} else if (gameStatus === "paused") {
					playGameEl.dispatchEvent(new Event("click"));
				}
			}
		}
	});
}

// можно ли повернуть
function canTurn(direction) {
	if (snakeDirection === direction) {
		return false;
	}

	if (snakeDirection === "right") {
		if (direction === "left") {
			return false;
		}
	}

	if (snakeDirection === "left") {
		if (direction === "right") {
			return false;
		}
	}

	if (snakeDirection === "up") {
		if (direction === "down") {
			return false;
		}
	}

	if (snakeDirection === "down") {
		if (direction === "up") {
			return false;
		}
	}

	return true;
}

// сброс состояния к дефолтному
function setDefaults() {
	score = 0;
	speed = 1;
	food = [];
	snake = [];
	length = config.initialLength;
	snakeDirection = "right";
	snakeChunksDirections = [];
	tickId = null;
	currentStepDuration = config.stepDuration;
	directionChanged = false;
	presetNextDirectionChanged = false;
	scoreEl.innerHTML = score;
	speedEl.innerHTML = speed;
	lengthEl.innerHTML = length;
	gameEl.classList.remove("game-over");
}

// запуск игры
function startGame() {
	setDefaults();
	initField();
	initSnake();
	drawSnake();
	createFood();
}

// Main function
function main() {
	shareBtns();
	initField();
	setListeners();
}

// запуск главной функции после прогрузки страницы
window.onload = main();
