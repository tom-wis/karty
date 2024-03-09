"use strict";


const e_mainContainer = document.getElementById('main-container');
const e_cardsContainer = document.getElementById('cards-container');

const e_sidebar = document.getElementById('sidebar');
const e_sidebarButton = document.getElementById('sidebar-button');
const e_sidebarClose = document.getElementById('sidebar-close');

const e_addCardText = document.getElementById('add-card-text');
const e_addCardButton = document.getElementById('add-card-button');

const e_boardsList = document.getElementById('boards-list');
const e_addBoardText = document.getElementById('add-board-text');
const e_addBoardButton = document.getElementById('add-board-button');

const e_autoSaveButton = document.getElementById('auto-save');
const e_saveButton = document.getElementById('save-button');
const e_settingsButton = document.getElementById('settings-button');
const e_deleteButton = document.getElementById('delete-button');

const e_cardContextMenu = document.getElementById('card-context-menu');
const e_cardContextMenuDelete = document.getElementById('card-context-menu-delete');
const e_cardContextMenuClear = document.getElementById('card-context-menu-clear');
const e_cardContextMenuDuplicate = document.getElementById('card-context-menu-duplicate');

const e_alerts = document.getElementById('alerts');

const e_title = document.getElementById('title');

// Interwał zapisywania danych (5 sekund)
let autoSaveInternalId = setInterval(function () {
    saveData();
}, 5000);

var appData = {
    'boards': [],
    'settings': {
        'userName': "User",
        //
        'dataPersistence': true
    },
    'currentBoard': 0,  // Indeks otwartej tablicy
    'identifier': 0
};

function currentCards() {
    return appData.boards[appData.currentBoard].cards;
}

function currentBoard() {
    return appData.boards[appData.currentBoard];
}


Array.prototype.move = function (from, to) {
    //przeniesienie elementu z tablicy do określonego indeksu tablicy

    this.splice(to, 0, this.splice(from, 1)[0]);
};

Array.prototype.insert = function (index, item) {
    //Wstaw element do określonego indeksu tablicy. 

    this.splice(index, 0, item);
};





//Funkcje użytkowe
function uniqueID() {
    appData.identifier += 1;
    return 'b' + appData.identifier;
}

function getMouseOverCard() {
    // Karta, nad którą aktualnie znajduje się kursor myszy; animacja hover
    return document.querySelectorAll('.parent-card:hover')[0];
}

function getMouseOverItem() {
    // Zadanie, nad którym aktualnie znajduje się kursor myszy
    return document.querySelectorAll('.parent-card > ul > li:hover')[0];
}

function getItemFromElement(element) {
    //Pobierz obiekt Iitem z elementu elementu listy.

    for (let _card of currentCards()) {
        for (let _item of _card.items) {
            if (_item.id === element.id) {
                return _item;
            }
        }
    }
}

function getCardFromElement(element) {

    //Pobierz obiekt Card z elementu div karty. */

    return currentCards().find(e => e.id === element.id);
}

function getBoardFromId(id) {
    /*  unique id dla tablic */

    return appData.boards.find(_b => _b.id === id);
}

function listBoards() {
    /* wyswietlanie list w pasku bocznym. */

    e_boardsList.innerHTML = '';
    for (let _board of appData.boards) {
        let _boardTitle = document.createElement('li');
        _boardTitle.innerText = _board.name;
        _boardTitle.id = _board.id;
        if (_board.id === currentBoard().id) _boardTitle.classList.add('is-active');
        _boardTitle.addEventListener('click', () => {
            renderBoard(_board);
            listBoards();
        });
        e_boardsList.appendChild(_boardTitle);
    }
}

function renderBoard(board) {
    appData.currentBoard = appData.boards.indexOf(board);
    document.title = 'Karty | ' + currentBoard().name;
    e_title.innerText = currentBoard().name;
    //pozwol edytowac nazwe tabliocy-  nieskonczone
    renderAllCards();
}

function renderAllCards() {
    /* odswiezanie kontenera karty. */

    for (let _card of e_cardsContainer.querySelectorAll('.parent-card')) {

        // usun karty z kontenera
        _card.remove();
    }

    for (let _card of currentCards()) {
        //odnow kazda karte
        let _generated = _card.generateElement();
        // Put them in the container right before the last child (text box for new card).
        e_cardsContainer.insertBefore(_generated, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
        // Update the card for event listeners and etc...
        _card.update();
    }
}

function renderCard(cardID) {
    let _card = currentCards().find(e => e.id === cardID);

    if (!_card) {
        // If card no longer exists in data. (ie: deleted but still rendered in DOM)
        // Remove it from the DOM
        let _currentCardElement = document.getElementById(cardID);
        _currentCardElement.parentNode.removeChild(_currentCardElement);
        return;
    }

    // Get current card element if it exists.
    let _currentCardElement = document.getElementById(_card.id);
    if (_currentCardElement != null) {
        let _generated = _card.generateElement();
        // Replace the card from the container.
        _currentCardElement.parentNode.replaceChild(_generated, _currentCardElement);
    } else {
        let _generated = _card.generateElement();
        // Put them in the container right before the last child (text box for new card).
        e_cardsContainer.insertBefore(_generated, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
    }

    // Update the event listeners.
    _card.update();
}

function toggleHoverStyle(show) {
    /* Sets whether hovering over cards/items changes their colors or not. */

    if (show) {

        // Create a new style element.
        let _hoverStyle = document.createElement('style');
        _hoverStyle.id = "dragHover";

        // Card and item should turn slightly darker when move over.
        // This gives a visual feedback that makes it easier for the user to know positions during drag and drop.
        _hoverStyle.innerHTML = ".parent-card:hover {background-color: #c7cbd1;}.parent-card > ul > li:hover {background-color: #d1d1d1;}";
        document.body.appendChild(_hoverStyle);
    } else {

        // Get rid of the style element.
        // This effectively prevents the elements from turning darker on hover.
        let _hoverStyle = document.getElementById('dragHover');
        _hoverStyle.parentNode.removeChild(_hoverStyle);
    }
}

function addBoard() {
    /* Adds a new board based on the input in the sidebar. */

    let _boardTitle = e_addBoardText.value;
    if (!_boardTitle) return createAlert("Wpisz nazwę tablicy!");  // We don't create a board if it has no name.
    if (appData.boards.length >= 512) return createAlert("Limit tablic osiągnięty.")  // or if there are already too many boards
    e_addBoardText.value = '';

    let _newBoard = new Board(_boardTitle, uniqueID(), { 'theme': null });
    appData.boards.push(_newBoard);
    listBoards();
}

/* <=================================== Classes ===================================> */
class Item {

    constructor(title, description = null, id, parentCardId) {
        this.title = title;
        this.description = description;  // A field for a future version, perhaps v2
        this.id = id;
        this.isDone = false;
        this.parentCardId = parentCardId;
    }

    getParentCard() {
        return document.getElementById(this.parentCardId);
    }

    check(chk = true) {
        this.isDone = chk;
        if (chk) {

            // Strikethrough the text if clicked on.
            // NOTE02: Might remove this feature as its not really needed.
            document.getElementById(this.id).style.textDecoration = 'line-through';
        } else {

            // Remove the strikethrough from the text.
            document.getElementById(this.id).style.textDecoration = 'none';
        }
    }

    update() {
        let _element = document.getElementById(this.id);

        _element.getElementsByTagName('p')[0].addEventListener('click', () => {
            if (this.isDone) {
                this.check(false);
            } else {
                this.check(true);
            }
        });

        _element.addEventListener('mousedown', cardDrag_startDragging, false);
        this.check(this.isDone);
    }
}

class Card {

    constructor(name, id, parentBoardId) {
        this.name = name;
        this.items = [];
        this.id = id;
        this.parentBoardId = parentBoardId;
    }

    addItem(item) {
        this.items.push(item);
        renderCard(this.id);
    }

    removeItem(item) {
        this.items = this.items.filter(val => val !== item);
        renderCard(this.id);
    }

    update() {
        for (let _item of this.items) {
            _item.update();
        }
    }

    renderItems() {
        let _newItemList = document.createElement('ul');
        _newItemList.id = this.id + '-ul';
        for (let _item of this.items) {
            let _newItem = document.createElement('li');
            _newItem.id = _item.id;

            // Item Title
            let _newItemTitle = document.createElement('p');
            _newItemTitle.innerText = _item.title;
            _newItemTitle.classList.add('item-title', 'text-fix', 'unselectable');

            // Housing for the edit and delete buttons.
            let _newItemButtons = document.createElement('span');

            // Edit button. Allows the user to rename the item.
            let _newItemEditButton = document.createElement('i');
            _newItemEditButton.ariaHidden = true;
            _newItemEditButton.classList.add('fa', 'fa-pencil');
            _newItemEditButton.addEventListener('click', () => {

                // Card item editing functionality.
                let _input = document.createElement('textarea');
                _input.value = _newItemTitle.textContent;
                _input.classList.add('item-title');
                _input.maxLength = 256;
                _newItemTitle.replaceWith(_input);

                let _save = () => {
                    _item.title = _input.value;
                    renderCard(this.id);
                };

                _input.addEventListener('blur', _save, {
                    once: true,
                });
                _input.focus();
            });

            // Delete button. ALlows the user to delete the item from the card.
            let _newItemDeleteButton = document.createElement('i');
            _newItemDeleteButton.ariaHidden = true;
            _newItemDeleteButton.classList.add('fa', 'fa-trash');
            _newItemDeleteButton.addEventListener('click', () => {
                createConfirmDialog("Na pewno chcesz usunąć tę zadanie?", () => this.removeItem(_item));
            });

            // Add both the buttons to the span tag.
            _newItemButtons.appendChild(_newItemEditButton);
            _newItemButtons.appendChild(_newItemDeleteButton);

            // Add the title, span tag to the item and the item itself to the list.
            _newItem.appendChild(_newItemTitle);
            _newItem.appendChild(_newItemButtons);
            _newItemList.appendChild(_newItem);
        }

        return _newItemList;
    }

    generateElement() {

        /* struktura karty. */


        let _newCardHeader = document.createElement('span');
        let _newCardHeaderTitle = document.createElement('h2');
        _newCardHeaderTitle.id = this.id + '-h2';
        _newCardHeaderTitle.innerText = this.name;
        _newCardHeaderTitle.classList.add('text-fix', 'card-title');


        _newCardHeaderTitle.addEventListener('click', (e) => {
            let _input = document.createElement('input');
            _input.value = _newCardHeaderTitle.textContent;
            _input.classList.add('card-title');
            _input.maxLength = 128;
            _newCardHeaderTitle.replaceWith(_input);

            let _save = () => {
                this.name = _input.value;
                renderCard(this.id);
            };

            _input.addEventListener('blur', _save, {
                once: true,
            });
            _input.focus();
        });

        // Hamburger menu - ikona
        let _newCardHeaderMenu = document.createElement('i');
        _newCardHeaderMenu.ariaHidden = true;
        _newCardHeaderMenu.classList.add("fa", "fa-bars");
        _newCardHeader.append(_newCardHeaderTitle);
        _newCardHeader.append(_newCardHeaderMenu);
        _newCardHeaderMenu.addEventListener('click', cardContextMenu_show);

        // Input do wpisania nazwy nowych zadań dla karty
        let _newInput = document.createElement('input');
        _newInput.id = this.id + '-input';
        _newInput.maxLength = 256;
        _newInput.type = 'text';
        _newInput.name = "add-todo-text";
        _newInput.placeholder = "Dodaj zadanie...";
        _newInput.addEventListener('keyup', (e) => {
            if (e.code === "Enter") _newButton.click();
        });

        // button "plus"
        let _newButton = document.createElement('button');
        _newButton.id = this.id + '-button';
        _newButton.classList.add("plus-button");
        _newButton.innerText = '+';
        _newButton.addEventListener('click', () => {
            let _inputValue = _newInput.value;
            if (!_inputValue) return createAlert("Wpisz nazwę zadania!");
            let _item = new Item(_inputValue, null, getBoardFromId(this.parentBoardId).uniqueID(), this.id);
            this.addItem(_item);
            _newInput.value = '';
            _newInput.focus();
        });

        let _newCard = document.createElement('div');
        _newCard.id = this.id;
        _newCard.classList.add('parent-card');
        _newCard.appendChild(_newCardHeader);

        if (this.items) {

            let _newItemList = this.renderItems();


            _newCard.appendChild(_newItemList);
        }

        _newCard.appendChild(_newInput);
        _newCard.appendChild(_newButton);

        return _newCard;
    }
}

class Board {

    constructor(name, id, settings, identifier = 0) {
        this.name = name;
        this.id = id;
        this.settings = settings;
        this.cards = [];  // karty jako obiekty
        this.identifier = identifier === null ? Date.now() : identifier;  // wszystkie elemnenty maja unqiue id.
    }

    uniqueID() {
        this.identifier += 1;
        return 'e' + this.identifier.toString();
    }

    addCard() {
        let _cardTitle = e_addCardText.value;
        e_addCardText.value = '';

        // domyslna nienazwana karta
        if (!_cardTitle) _cardTitle = `Karta bez nazwy ${this.cards.length + 1}`;

        let _card = new Card(_cardTitle, this.uniqueID(), this.id);
        this.cards.push(_card);

        let _newCard = _card.generateElement();
        e_cardsContainer.insertBefore(_newCard, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
    }
}

/* Drag 'n' Drop*/
var cardDrag_mouseDown = false;
var cardDrag_mouseDownOn = null;

const cardDrag_update = (e) => {

    // aktualizuj tylko wtedy, gdy mysz jest wciśnięta i na elemencie przedmiotu.
    if (!cardDrag_mouseDown && !cardDrag_mouseDownOn) return;

    // Karta musi znajdować się na tych samych współrzędnych, co kursor myszy.
    // Symuluje efekt chwytania karty przez kursor.
    cardDrag_mouseDownOn.style.left = e.pageX + 'px';
    cardDrag_mouseDownOn.style.top = e.pageY + 'px';
};

const cardDrag_startDragging = (e) => {

    // Przechwytuj tylko te elementy, które są elementami listy.
    // W przeciwnym razie będziemy mogli indywidualnie pobierać elementy podrzędne elementu listy.

    if (e.target.tagName !== 'LI') return;

    cardDrag_mouseDown = true;
    cardDrag_mouseDownOn = e.target;

    // Ustaw pozycję elementu na absolutną
    // Dzięki temu możemy wyjąć element z obiegu dokumentu i pobawić się jego współrzędnymi.
    cardDrag_mouseDownOn.style.position = 'absolute';

    // Włącz styl CSS, który powoduje przyciemnienie innych kart i przedmiotów po najechaniu myszką.
    toggleHoverStyle(true);
};

const cardDrag_stopDragging = (e) => {

    // Uruchom kod zatrzymania przeciągania tylko wtedy, gdy mysz była wcześniej naciśnięta na elemencie elementu.
    if (!cardDrag_mouseDown) return;

    // Wyłącz styl CSS, który zapobiega przyciemnianiu kart i przedmiotów po najechaniu myszką.
    toggleHoverStyle(false);

    let _hoverCard = getMouseOverCard();
    if (_hoverCard) {
        let _hoverItem = getMouseOverItem();

        // Pobierz obiekt z elementu karty, nad którym znajduje się mysz.
        let _hoverCardObject = getCardFromElement(_hoverCard);
        // Pobierz obiekt z elementu, który trzyma mysz.
        let _heldItemObject = getItemFromElement(cardDrag_mouseDownOn);

        if (_hoverCard === _heldItemObject.getParentCard()) {

            if (_hoverItem) {

                if (_hoverItem !== cardDrag_mouseDownOn) {

                    let _hoverItemObject = getItemFromElement(_hoverItem);

                    _hoverCardObject.items.move(_hoverCardObject.items.indexOf(_heldItemObject), _hoverCardObject.items.indexOf(_hoverItemObject));
                }
            }

            renderCard(_heldItemObject.getParentCard().id);

        } else {

            if (_hoverItem) {

                if (_hoverItem !== cardDrag_mouseDownOn) {

                    let _hoverItemObject = getItemFromElement(_hoverItem);
                    let _hoverItemParentObject = getCardFromElement(_hoverItemObject.getParentCard());
                    _hoverItemParentObject.items.insert(_hoverItemParentObject.items.indexOf(_hoverItemObject), _heldItemObject);
                    getCardFromElement(_heldItemObject.getParentCard()).removeItem(_heldItemObject);
                    _heldItemObject.parentCardId = _hoverItemParentObject.id;
                }
            } else {

                _hoverCardObject.items.push(_heldItemObject);
                getCardFromElement(_heldItemObject.getParentCard()).removeItem(_heldItemObject);
                _heldItemObject.parentCardId = _hoverCardObject.id;
            }

            renderCard(_hoverCardObject.id);
            renderCard(_heldItemObject.getParentCard().id);
        }

    }
    cardDrag_mouseDown = false;
    cardDrag_mouseDownOn.style.position = 'static';
    cardDrag_mouseDownOn = null;
};


e_mainContainer.addEventListener('mousemove', cardDrag_update);
e_mainContainer.addEventListener('mouseleave', cardDrag_stopDragging, false);
window.addEventListener('mouseup', cardDrag_stopDragging, false);

/* drag scrolling  */
// Ta funkcja pozwala użytkownikowi przytrzymać i
//przeciągnąć główny kontener kart w celu przewijania, zamiast przytrzymywać pasek przewijania.

let scroll_mouseDown = false;
let scroll_startX, scroll_scrollLeft;

const scroll_startDragging = (e) => {
    scroll_mouseDown = true;
    scroll_startX = e.pageX - e_mainContainer.offsetLeft;
    scroll_scrollLeft = e_mainContainer.scrollLeft;
};

const scroll_stopDragging = (e) => {
    scroll_mouseDown = false;
};

const scroll_update = (e) => {
    e.preventDefault();
    if (!scroll_mouseDown || cardDrag_mouseDown) return;

    let _scroll = (e.pageX - e_mainContainer.offsetLeft) - scroll_startX;
    e_mainContainer.scrollLeft = scroll_scrollLeft - _scroll;
};

// event listeners  dodane
e_mainContainer.addEventListener('mousedown', scroll_startDragging, false);
e_mainContainer.addEventListener('mouseup', scroll_stopDragging, false);
e_mainContainer.addEventListener('mouseleave', scroll_stopDragging, false);


//menu kontekstowe
let cardContextMenu_currentCard;
const cardContextMenu_show = (e) => {

    cardContextMenu_currentCard = getMouseOverCard();

    const { clientX: mouseX, clientY: mouseY } = e;
    e_cardContextMenu.style.top = mouseY + 'px';
    e_cardContextMenu.style.left = mouseX + 'px';

    e_cardContextMenu.classList.remove('visible');
    setTimeout(() => {
        e_cardContextMenu.classList.add('visible');
    });

};

const cardContextMenu_hide = (e) => {
    // chowanie menu kontekstowego jesli klikniete poza nim
    if (e.target.offsetParent != e_cardContextMenu && e_cardContextMenu.classList.contains('visible')) {
        e_cardContextMenu.classList.remove("visible");
    }
};

const cardContextMenu_clearCard = () => {
    createConfirmDialog('Na pewno chcesz wyczyścić tę tablicę?', () => {
        let _currentCardObject = getCardFromElement(cardContextMenu_currentCard);

        _currentCardObject.items.length = 0;
        renderCard(_currentCardObject.id);
    });
};

const cardContextMenu_deleteCard = () => {
    createConfirmDialog('Na pewno chcesz usunąć tę kartę?', () => {
        let _currentCardObject = getCardFromElement(cardContextMenu_currentCard);

        // usun karte z listy kart
        currentCards().splice(currentCards().indexOf(_currentCardObject), 1);
        cardContextMenu_hide({ target: { offsetParent: 'n/a' } });

        renderCard(_currentCardObject.id);
    });
}

const cardContextMenu_duplicateCard = () => {
    let _currentCardObject = getCardFromElement(cardContextMenu_currentCard);

    currentBoard().addCard();

    let _cIndex = currentBoard().cards.length - 1;
    currentBoard().cards[_cIndex].items = _currentCardObject.items;
    currentBoard().cards[_cIndex].name = _currentCardObject.name + ' Copy';

    renderCard(currentBoard().cards[_cIndex].id);
}


document.body.addEventListener('click', cardContextMenu_hide);
e_cardContextMenuClear.addEventListener('click', cardContextMenu_clearCard);
e_cardContextMenuDelete.addEventListener('click', cardContextMenu_deleteCard);
e_cardContextMenuDuplicate.addEventListener('click', cardContextMenu_duplicateCard);

//przechowywanie danych
function saveData() {
    window.localStorage.setItem('kards-appData', JSON.stringify(appData));
}

function getDataFromLocalStorage() {
    return window.localStorage.getItem('kards-appData');
}

function loadData() {
    let _data = window.localStorage.getItem('kards-appData');
    if (_data) {
        let _appData = JSON.parse(_data);


        // inicjalizowanie danych startowych
        appData.settings = _appData.settings;
        appData.currentBoard = _appData.currentBoard >= 0 ? appData.currentBoard : 0;
        appData.identifier = _appData.identifier !== null ? appData.identifier : 0;

        //wypelnij tablicami
        for (let _board of _appData.boards) {
            let _newBoard = new Board(_board.name, _board.id, _board.settings, _board.identifier);

            // wypelnij tablice kartami
            for (let _card of _board.cards) {
                let _newCard = new Card(_card.name, _card.id, _board.id);

                // wypelnij karty wpisami
                for (let _item of _card.items) {
                    let _newItem = new Item(_item.title, _item.description, _item.id, _card.id);
                    // wyswietl wpisy na karcie
                    _newCard.items.push(_newItem);
                }
                // wyswietl katte na tablicy.
                _newBoard.cards.push(_newCard);
            }
            // wyswietl tablice w appce.
            appData.boards.push(_newBoard);
        }

        // generuj tablice 
        renderBoard(appData.boards[appData.currentBoard]);
    } else {
        appData.currentBoard = 0;
        let _defaultBoard = new Board("Tablica bez nazwy", 'b0', { 'theme': null });
        appData.boards.push(_defaultBoard);
    }
    listBoards();
}

function clearData() {
    window.localStorage.clear();
}

loadData();

//reszta eventow 
e_addCardText.addEventListener('keyup', (e) => {
    if (e.code === "Enter") currentBoard().addCard();
});

e_addCardButton.addEventListener('click', () => currentBoard().addCard());

e_addBoardText.addEventListener('keyup', (e) => {
    if (e.code === "Enter") addBoard();
});

e_addBoardButton.addEventListener('click', addBoard);

e_autoSaveButton.addEventListener('change', function (event) {
    if (this.checked) {
        autoSaveInternalId = setInterval(function () {
            saveData();
        }, 5000);
    } else {
        window.clearInterval(autoSaveInternalId);
    }
})
//e_saveButton.addEventListener('click', saveData);
e_saveButton.addEventListener('click', () => { saveData(); createAlert("Tablica zapisana.") });

e_deleteButton.addEventListener('click', () => {
    createConfirmDialog('Na pewno chcesz usunąć tę tablicę?', () => {
        let _boardName = currentBoard().name;

        // usuń tablice
        appData.boards.splice(appData.currentBoard, 1);
        if (appData.currentBoard !== 0) {
            appData.currentBoard--;
        }

        if (appData.boards.length === 0) {
            let _defaultBoard = new Board("Tablica bez nazwy", 'b0', { 'theme': null });
            appData.boards.push(_defaultBoard);
            appData.currentBoard = 0;
        }

        listBoards();
        renderBoard(appData.boards[appData.currentBoard]);

        createAlert(`Deleted board "${_boardName}"`)
    });
});

window.onbeforeunload = function () {
    if (JSON.stringify(appData) !== getDataFromLocalStorage()) {
        return confirm();
    }
}


//sidebar

function toggleSidebar() {
    if (('toggled' in e_sidebar.dataset)) {
        delete e_sidebar.dataset.toggled;
        e_sidebar.style.width = "0";
        e_sidebar.style.boxShadow = "unset";

        // Remove listen click outside of side
        document.removeEventListener('click', listenClickOutside);
    } else {
        e_sidebar.dataset.toggled = '';
        e_sidebar.style.width = "250px";
        e_sidebar.style.boxShadow = "100px 100px 0 100vw rgb(0 0 0 / 50%)";
        // Listen click outside of sidebar
        setTimeout(() => {
            document.addEventListener('click', listenClickOutside);
        }, 300);
    }
}

e_sidebarButton.addEventListener('click', toggleSidebar);
e_sidebarClose.addEventListener('click', toggleSidebar);

/* alerty-modale */

function createAlert(text) {
    let _e = document.createElement('div');
    let _p = document.createElement('p');
    _p.innerText = text;
    _e.classList.add('alert');
    _e.appendChild(_p);

    e_alerts.appendChild(_e);
    setTimeout(function () {
        _e.classList.add('animate-hidden');
    }, 3500);
    setTimeout(function () {
        _e.parentNode.removeChild(_e);
    }, 4500);
}

function listenClickOutside(event) {
    const _withinBoundaries = event.composedPath().includes(e_sidebar);
    if (!_withinBoundaries && e_sidebar.style.width === "250px") {
        toggleSidebar();
    }
}

function createConfirmDialog(text, onConfirm) {

    // schowaj menu jesli otwarte
    cardContextMenu_hide({ target: { offsetParent: 'n/a' } });

    var _modal = document.getElementById("confirm-dialog");
    var _span = document.getElementById("confirm-dialog-close");
    var _dialogText = document.getElementById('confirm-dialog-text');
    var _cancelButton = document.getElementById('confirm-dialog-cancel');
    var _confirmButton = document.getElementById('confirm-dialog-confirm');

    _modal.style.display = "block";
    _dialogText.textContent = text;

    _span.onclick = function () {
        _modal.style.display = "none";
    }

    _cancelButton.onclick = () => {
        _modal.style.display = "none";
    }

    _confirmButton.onclick = () => {
        _modal.style.display = "none";
        onConfirm && onConfirm();
    }

    window.onclick = (event) => {
        if (event.target === _modal) {
            _modal.style.display = "none";
        }
    }
}