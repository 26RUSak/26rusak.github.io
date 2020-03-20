const formSearch = document.querySelector('.form-search'),
    inputCitiesFrom = formSearch.querySelector('.input__cities-from'),
    dropdownCitiesFrom = formSearch.querySelector('.dropdown__cities-from'),
    inputCitiesTo = formSearch.querySelector('.input__cities-to'),
    dropdownCitiesTo = formSearch.querySelector('.dropdown__cities-to'),
    inputDateDepart = formSearch.querySelector('.input__date-depart'),
    buttonSearch = formSearch.querySelector('.button__search'),
    cheapestTicket = document.querySelector('#cheapest-ticket'),
    otherCheapestTicket = document.querySelector('#other-cheapest-tickets');
    
// АПИ
// https://www.aviasales.ru/API
// https://support.travelpayouts.com/hc/ru/articles/203956163-Aviasales-API-%D0%B4%D0%BE%D1%81%D1%82%D1%83%D0%BF%D0%B0-%D0%BA-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%BC-%D0%B4%D0%BB%D1%8F-%D1%83%D1%87%D0%B0%D1%81%D1%82%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2-%D0%BF%D0%B0%D1%80%D1%82%D0%BD%D0%B5%D1%80%D1%81%D0%BA%D0%BE%D0%B9-%D0%BF%D1%80%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%D1%8B

// Константы
const 
    // CITY_API = 'http://api.travelpayouts.com/data/ru/cities.json';// Но нужна прокси. И запускать index.html не с локалхоста, а как обычный файл
    IS_PROXY = false,
    PROXY = 'https://cors-anywhere.herokuapp.com/',
    CITY_API = 'dataBase/cities.json',
    API_KEY = 'd7ff54e89b58d144eaa8da9acd8e95de',
    CALENDAR = 'http://min-prices.aviasales.ru/calendar_preload',
    MAX_COUNT = 5;
// const city = ['Москва', 'Санкт-Петербург', 'Минск', 'Караганда', 'Челябинск', 'Керч', 
//     'Волгоград', 'Самара', 'Днепропетровск', 'Екатеринбург', 'Одесса', 'Ухань', 
//     'Шымкен', 'Нижний Новгород', 'Калининград', 'Вроцлав', 'Ростов-на-Дону'];

let cheapTicketDay;
let one_way = true;
let city = [];
let tickets = {};
let arName = '';

// Функция для получения данных
const getData = (url, callback=false, reject = console.error) => {
    const request = new XMLHttpRequest();

    if (IS_PROXY) url = PROXY + url;

    request.open('GET', url);// Статус 1

    request.addEventListener('readystatechange', () => {
        // Если не ответ от сервера
        if (request.readyState !== 4) return;
        
        // Если ответ от сервера со статусом 200
        if (request.status === 200) {
            if (callback) {
                callback(request.response);
            } else {
                reject(request.response);
            }
        } else {
            reject(request.status);
        }
    });

    request.send();// Статус 2. 4- ответ от сервера
}

// Парсим города
const parseCities = (data) => {
    city = JSON.parse(data).filter((item) => item.name);

    city.sort((a, b) => {
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
    });
};

// Функция для показа отфильтрованного списка городов для поля Откуда/Куда
const showCity = (input, list) => {

    list.textContent = '';

    if (input.value === '') return;

    const filterCity = city.filter((item) => {
        // const fixItem = item.toLowerCase();// Если города обычным массивом
        const fixItem = item.name.toLowerCase();
        return fixItem.startsWith(input.value.toLowerCase());
    });

    // console.log(filterCity);

    list.classList.add('show');

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

// Функция для обработки полученных билетов с минимальной ценой на определенную дату
const cheapMinPrices = (tickets) => {
    var min_price_index = 0;
    var ticketMinPrice = tickets[min_price_index];
    if (ticketMinPrice !== undefined) {
        var minPrice = ticketMinPrice.value;
        for (var i = 1; i < tickets.length; i++) {
            if (minPrice > tickets[i].value) {
                minPrice =tickets[i].value;
                var ticketMinPrice = tickets[i];
                min_price_index = i;
            }
        }
        
        // delete tickets[min_price_index];
        delete cheapTicketYear[arName][min_price_index];
    }
    return ticketMinPrice;
}

// Создаем блок с билетом
const renderCheapTicket = (ticketMinPrice) => {
    // console.log(ticket);

    var ticket = document.createElement('article');
    ticket.classList.add('ticket');
    
    let deep = '';
    if (ticketMinPrice) {
        var price = ticketMinPrice.value;
        var gate = ticketMinPrice.gate;
        var date = ticketMinPrice.depart_date;
        var origin = ticketMinPrice.origin;
        var destination = ticketMinPrice.destination;
        var number_of_changes = ticketMinPrice.number_of_changes;

        deep = `
        <h3 class="agent">${gate}</h3>
        <div class="ticket__wrapper">
            <div class="left-side">
                <a target="_blank" href="${getLinkAviasales(ticketMinPrice)}" class="button button__buy">Купить
                    ${price}₽</a>
            </div>
            <div class="right-side">
                <div class="block-left">
                    <div class="city__from">Вылет из города
                        <span class="city__name">${getNameCity(origin)}</span>
                    </div>
                    <div class="date">${getDate(date)}</div>
                </div>

                <div class="block-right">
                    <div class="changes">${getChanges(number_of_changes)}</div>
                    <div class="city__to">Город назначения:
                        <span class="city__name">${getNameCity(destination)}</span>
                    </div>
                </div>
            </div>
        </div>
        `;
    } else {
        deep = '<h3>К сожалению билетов не нашлось на вашу дату!</h3>';
    }
    // console.log(deep);

    ticket.insertAdjacentHTML('afterbegin', deep);
      
    return ticket;
}

// Функция для получения ссылки
const getLinkAviasales = (data) => {
    let link = 'https://www.aviasales.ru/search/';

    let dateStr = new Date(data.depart_date);

    let month = dateStr.getMonth()+1;
    let day = dateStr.getDate();

    link += data.origin;
    link += day < 10 ? '0' + day  : day;
    link += month < 10 ? '0' + month  : month;
    link += data.destination;
    link += '1'; // Количество пассажиров

    return link;
}
// Функция для получения форматированной даты
const getDate = (date) => {
    var dateStr = new Date(date);
    return dateStr.toLocaleString('ru', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Получаем город по коду
const getNameCity = (code) => {
    const objCity = city.find(item => item.code === code);
    return objCity.name;
}
    
// Получаем строку для строки количества пересадок
const getChanges = (n) => {
    if (n) {
        return n === 1 ? 'С одной пересадкой' : 'С двумя пересадками';
    } else {
        return 'Без пересадок';
    }
}

// Создаем блок с билетом, у которого минимальная цена
const renderCheapDay = (cheapTicket, cheapestTicket) => {
    cheapestTicket.innerHTML = '<h2>Самый дешевый билет на выбранную дату</h2>';
    ticketMinPrice = cheapMinPrices(cheapTicket);
    // delete cheapTicketYear[index];
    // delete cheapTicketYear[index];
    const ticket = renderCheapTicket(ticketMinPrice);
    cheapestTicket.classList.add('show');
    cheapestTicket.append(ticket);
}
// Создаем блок с билетами от меньшей цены к большей
const renderCheapYear = (cheapTicket, cheapestTicket) => {
    cheapestTicket.innerHTML = '<h2>Самые дешевые билеты на другие даты</h2>';

    // Сортируем билеты по цене
    cheapTicket.sort((a, b) => {
        if (a.value > b.value) return 1;
        if (a.value < b.value) return -1;
        return 0;
    });

    for (var i = 0; i < cheapTicket.length && i < MAX_COUNT; i++) {
        if (cheapTicket[i] === undefined) continue;
        var ticket = renderCheapTicket(cheapTicket[i]);
        cheapestTicket.append(ticket);
    }
    cheapestTicket.classList.add('show');
}

// Создаем билеты
const renderCheap = (response, date, cheapestTicket, otherCheapestTicket) => {
    cheapTicketYear = JSON.parse(response);
    if (one_way) {
        arName = 'best_prices';
    } else {
        arName = 'current_depart_date_prices';
    }
    cheapTicketDay = cheapTicketYear[arName].filter(item => item.depart_date == date);
    // console.log(cheapTicketDay);
    // console.log(cheapTicketYear[arName]);

    renderCheapDay(cheapTicketDay, cheapestTicket);
    // renderCheapYear(cheapTicketDay, cheapestTicket);
    renderCheapYear(cheapTicketYear[arName], otherCheapestTicket);
}

// Событие для показа списка городов при фокусе в инпут откуда
inputCitiesFrom.addEventListener('focus', (e) => {
    dropdownCitiesFrom.classList.add('show');
});

// Событие для скрытия списка городов при убирании фокуса у инпута откуда
inputCitiesFrom.addEventListener('focusout', (e) => {
    dropdownCitiesFrom.classList.remove('show');
});

// Событие для показа списка городов при фокусе в инпут куда
inputCitiesTo.addEventListener('focus', (e) => {
    dropdownCitiesTo.classList.add('show');
});

// Событие для скрытия списка городов при убирании фокуса у инпута откуда
inputCitiesTo.addEventListener('focusout', (e) => {
    dropdownCitiesTo.classList.remove('show');
});

// Событие для показа билетов
formSearch.addEventListener('submit', (e) => {
    e.preventDefault();

    const cityFrom = city.find(item => inputCitiesFrom.value === item.name);
    const cityTo = city.find(item => inputCitiesTo.value === item.name);

    const formData = {
        from: cityFrom,
        to: cityTo,
        when: inputDateDepart.value,
    };

    if (formData.from && formData.to) {
        const requestData = `?origin=${formData.from.code}&destination=${formData.to.code}` + 
        `&depart_date=${formData.when}&token=${API_KEY}${(one_way?'&one_way=true':'')}`;

        // console.log(formData);
        
        getData(CALENDAR + requestData, (response) => {
            renderCheap(response, formData.when, cheapestTicket, otherCheapestTicket);
            }, e => {
                console.error('Ошибка направления!', e);
                alert('В этом направлении нет рейсов!');  
            }
        );
    } else {
        alert('Введите корретное название города!');
    }
    // getCalendar(requestData, inputDateDepart, cheapestTicket);
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
getData(CITY_API, parseCities);

// http://127.0.0.1:5500/aviasales/?debug=1
const debug = (from, to, date) => {
    if (/debug=1/.test(window.location.search)) {
        var from = 'Екатеринбург';
        var fromCode = 'SVX';
        var to = 'Калининград';
        var toCode = 'KGD';
    } else {
        var from = 'Москва';
        var to = 'Монаханс';
    }
    inputCitiesFrom.value = from;
    inputCitiesFrom.setAttribute('origin', fromCode);
    inputCitiesTo.value = to;
    inputCitiesTo.setAttribute('destination', toCode);
    inputDateDepart.value = '2020-05-25';
}

if (/debug=/.test(window.location.search)) {
    debug();
}