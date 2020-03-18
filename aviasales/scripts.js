const formSearch = document.querySelector('.form-search'),
    inputCitiesFrom = formSearch.querySelector('.input__cities-from'),
    dropdownCitiesFrom = formSearch.querySelector('.dropdown__cities-from'),
    inputCitiesTo = formSearch.querySelector('.input__cities-to'),
    dropdownCitiesTo = formSearch.querySelector('.dropdown__cities-to'),
    inputDateDepart = formSearch.querySelector('.input__date-depart');

const city = ['Москва', 'Санкт-Петербург', 'Минск', 'Караганда', 'Челябинск', 'Керч', 
    'Волгоград', 'Самара', 'Днепропетровск', 'Екатеринбург', 'Одесса', 'Ухань', 
    'Шымкен', 'Нижний Новгород', 'Калининград', 'Вроцлав', 'Ростов-на-Дону'];

// console.log(formSearch);
 
// Функция для показа отфильтрованного списка городов для поля Откуда/Куда
const showCity = (input, list) => {

    list.textContent = '';

    if (input.value === '') return;

    const filterCity = city.filter((item) => {
        const fixItem = item.toLowerCase();
        return fixItem.includes(input.value.toLowerCase());
    });

    // console.log(filterCity);

    filterCity.forEach((item) => {
        const li = document.createElement('li');
        li.classList.add('dropdown__city');
        li.textContent = item;
        list.append(li);
    });

};

// Функция для установки города после клика по городу из отфильтрованного списка городов для поля Откуда/Куда
const setCity = (event, input, list) => {

    const target = event.target;
    
    if (target.tagName.toLowerCase() === 'li') {
        // console.log(target.textContent);
        input.value = target.textContent;
        list.textContent = '';
    }

};

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