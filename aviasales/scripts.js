const formSearch = document.querySelector('.form-search'),
    inputCitiesFrom = formSearch.querySelector('.input__cities-from'),
    dropdownCitiesFrom = formSearch.querySelector('.dropdown__cities-from'),
    inputCitiesTo = formSearch.querySelector('.input__cities-to'),
    dropdownCitiesTo = formSearch.querySelector('.dropdown__cities-to'),
    inputDateDepart = formSearch.querySelector('.input__date-depart'),
    buttonSearch = formSearch.querySelector('.button__search'),
    cheapestTicket = document.querySelector('.cheapest-ticket');

// АПИ
// https://www.aviasales.ru/API
// https://support.travelpayouts.com/hc/ru/articles/203956163-Aviasales-API-%D0%B4%D0%BE%D1%81%D1%82%D1%83%D0%BF%D0%B0-%D0%BA-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%BC-%D0%B4%D0%BB%D1%8F-%D1%83%D1%87%D0%B0%D1%81%D1%82%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2-%D0%BF%D0%B0%D1%80%D1%82%D0%BD%D0%B5%D1%80%D1%81%D0%BA%D0%BE%D0%B9-%D0%BF%D1%80%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%D1%8B

// Константы
const 
    // CITY_API = 'http://api.travelpayouts.com/data/ru/cities.json';// Но нужна прокси. И запускать index.html не с локалхоста, а как обычный файл
    CITY_API = 'dataBase/cities.json',
    PROXY = 'https://cors-anywhere.herokuapp.com/',
    API_KEY = 'd7ff54e89b58d144eaa8da9acd8e95de',
    CALENDAR = 'http://min-prices.aviasales.ru/calendar_preload';
// const city = ['Москва', 'Санкт-Петербург', 'Минск', 'Караганда', 'Челябинск', 'Керч', 
//     'Волгоград', 'Самара', 'Днепропетровск', 'Екатеринбург', 'Одесса', 'Ухань', 
//     'Шымкен', 'Нижний Новгород', 'Калининград', 'Вроцлав', 'Ростов-на-Дону'];

let city = [];
let tickets = {};

// Функция для получения данных
const getData = (url, callback=false) => {
    const request = new XMLHttpRequest();

    request.open('GET', url);// Статус 1

    request.addEventListener('readystatechange', () => {
        // Если не ответ от сервера
        if (request.readyState !== 4) return;
        
        // Если ответ от сервера со статусом 200
        if (request.status === 200) {
            if (callback) {
                callback(request.response);
            } else {
                console.log(request.response);
            }
        } else {
            console.log(request.status);
        }
    });

    request.send();// Статус 2. 4- ответ от сервера
}

// Парсим города
const parseCities = (data) => {
    city = JSON.parse(data).filter((item) => item.name);
}

// Функция для показа отфильтрованного списка городов для поля Откуда/Куда
const showCity = (input, list) => {

    list.textContent = '';

    if (input.value === '') return;

    const filterCity = city.filter((item) => {
        // const fixItem = item.toLowerCase();// Если города обычным массивом
        const fixItem = item.name.toLowerCase();
        return fixItem.includes(input.value.toLowerCase());
    });

    // console.log(filterCity);

    filterCity.forEach((item) => {
        const li = document.createElement('li');
        li.classList.add('dropdown__city');
        // li.textContent = item; // Если города обычным массивом
        li.textContent = item.name;
        if (input.classList.contains('input__cities-from')) {
            var codeAttrCity = 'origin';
        } else if (input.classList.contains('input__cities-to')) {
            var codeAttrCity = 'destination';
        }
        li.setAttribute(codeAttrCity, item.code);
        list.append(li);
    });

};

// Функция для установки города после клика по городу из отфильтрованного списка городов для поля Откуда/Куда
const setCity = (event, input, list) => {

    const target = event.target;
    
    if (target.tagName.toLowerCase() === 'li') {
        // console.log(target.textContent);
        input.value = target.textContent;

        if (target.hasAttribute('origin')) {
            input.setAttribute('origin', target.getAttribute('origin'));
        } else if (target.hasAttribute('destination')) {
            input.setAttribute('destination', target.getAttribute('destination'));
        }

        list.textContent = '';
    }

};

// Функция для обработки полученных билетов на определенную дату
const parseCalendar = (data) => {
    tickets = JSON.parse(data);
    //console.log(tickets);
};

// Функция для обработки полученных билетов с минимальной ценой на определенную дату
const parseCalendarMinPrices = (tickets) => {
    var ticketMinPrice = tickets[0];
    var minPrice = ticketMinPrice.value;
    for (var i = 0; i < tickets.length; i++) {
        if (minPrice > tickets[i].value) {
            minPrice =tickets[i].value;
            var ticketMinPrice = tickets[i];
        }
    }
    return ticketMinPrice;
}

// Создаем блок с билетом, у которого минимальная цена
const setMinPriceCity = (ticket, cheapestTicket) => {
    // console.log(ticket);
    var price = ticket.value;
    var gate = ticket.gate;

    const div = document.createElement('div');
    div.classList.add('ticket_min_price');
  
    div.textContent = price + ' руб. - ' + gate;
    cheapestTicket.parentElement.classList.add('show');
    cheapestTicket.append(div);
}

// Функция для получения билетов на определенную дату
const getCalendar = (from, to, date, cheapestTicket) => {
    var url = CALENDAR + 
    '?origin=' + from.getAttribute('origin') + 
    '&destination=' + to.getAttribute('destination') + 
    '&depart_date=' + date.value;
    getData(url, (data) => {
        parseCalendar(data);
        var ticketMinPrice = parseCalendarMinPrices(tickets.current_depart_date_prices);
        setMinPriceCity(ticketMinPrice, cheapestTicket);
    });
}

// Событие для показа билетов
formSearch.addEventListener('submit', () => {
    getCalendar(inputCitiesFrom, inputCitiesTo, inputDateDepart, cheapestTicket);
});

// Событие для показа отфильтрованного списка городов для поля Откуда
inputCitiesFrom.addEventListener('input', () => {
    showCity(inputCitiesFrom, dropdownCitiesFrom);
});

// Событие для показа отфильтрованного списка городов для поля Куда
inputCitiesTo.addEventListener('input', () => {
    showCity(inputCitiesTo, dropdownCitiesTo);
});

// Событие для установки города после клика по городу из отфильтрованного списка городов для поля Откуда
dropdownCitiesFrom.addEventListener('click', (event) => {
    setCity(event, inputCitiesFrom, dropdownCitiesFrom);
});

// Событие для установки города после клика по городу из отфильтрованного списка городов для поля Куда
dropdownCitiesTo.addEventListener('click', (event) => {
    setCity(event, inputCitiesTo, dropdownCitiesTo);
});

// Вызовы функций
// getData('https://jsonplaceholder.typicode.com/todos/1');
// getData(PROXY + CITY_API, parseCities);
getData(CITY_API, parseCities);

// http://127.0.0.1:5500/aviasales/?debug=1
const debug = (from, to, date) => {
    inputCitiesFrom.value = 'Екатеринбург';
    inputCitiesFrom.setAttribute('origin', 'SVX');
    inputCitiesTo.value = 'Калининград';
    inputCitiesTo.setAttribute('destination', 'KGD');
    inputDateDepart.value = '2020-05-25';
}

if (/debug=1/.test(window.location.search)) {
    debug();
}