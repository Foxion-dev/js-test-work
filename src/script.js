document.addEventListener('DOMContentLoaded', function(){ 


	/* Обьявим ключи в LocalStorage */

	if(!localStorage.favoritePhotos){
		localStorage.favoritePhotos = ''
	}
	if(!localStorage.favoriteAlbums){
		localStorage.favoriteAlbums = ''
	}
	if(!localStorage.activeTab){
		localStorage.activeTab = '1'
	}
	
	/* Зададим константы запросов */

	const albumUrl  = 'https://json.medrating.org/albums?userId=';
	const photosUrl = 'https://json.medrating.org/photos?albumId=';
	const userUrl   = 'https://json.medrating.org/users/';

	/* Зададим константы/переменные DOM  */

	const listHTML = document.getElementById('user-list');
	const favoriteHTML = document.getElementById('favorite-list');
	const lightBoxModal = document.getElementById('light-box');
	const closeLightBox = document.querySelector('.close-light-box');
	let tabLinks = document.querySelectorAll('.js-tab-link');

	/* Объявим нужные в дальнейшем переменные  */

	let albums,photos;
	let opensAlbum = [];
	let opensPhotos = [];
	let favoritePhotos = [];

	/* Получим массив избранных фотографий из LocalStorage при загрузке страницы */

	favoritePhotos = localStorage.favoritePhotos.split('|');
	favoritePhotos = favoritePhotos.filter((photo) => photo != '');

	/* Получим контент активного таба  */

	getActiveContentTab(localStorage.activeTab)

	/* Зададим синхронные обработчики событий  */

	tabLinks.forEach((item,idx) => {
		
		item.addEventListener('click', function (e) {
			e.preventDefault()
			getActiveContentTab(this.getAttribute('data-content-id'))
		});

	})

	closeLightBox.addEventListener('click', () => {
		lightBoxModal.classList.remove('open');
	})

	/*
	* Функция принимает id активного таба
	* Получает данные из LocalStorage о фотографиях и альбомах,
	* Меняет значение активного таба в LocalStorage
	* Добавляет асинхронные обработчики событий
	* Функция возвращает метод, который отображает разметку текущего таба
	*/

	function getActiveContentTab(id) {
			let activeTab = id
			let contentVariable = [...document.querySelectorAll('.js-content-tab')]
			let favoritePhotosObjects = getFavoritePhotoData(localStorage.favoritePhotos, localStorage.favoriteAlbums); // делать в момент клика на там избранное
			let favoriteResolve =  constructHtmlFavorite(favoritePhotosObjects, favoriteHTML);
			
			localStorage.activeTab = activeTab

			for(let hideContent of contentVariable){
					hideContent.style.display = 'none';
			}

			favoriteResolve.then(html => {
				setTimeout(()=>{
					addCustomEventsHtmlSelector()
				},1500)
			})
			
			return getActiveContentHTML(activeTab)
	}

	/*
	* Функция принимает id активного таба
	* Функция отображает активный таб
	* В функции задействован прелоадер для более корректного отображения запроса
	*/

	async function getActiveContentHTML(id){

		await document.getElementById('preloader').classList.add('open');
		let contentVariable = await [...document.querySelectorAll('.js-content-tab')]
		for(let showContent of contentVariable){
			if(showContent.getAttribute('data-content-id') == id){
				showContent.style.display = 'block';
			}
		}
		setTimeout(()=>{
				document.getElementById('preloader').classList.remove('open');
		},2000)
	}

	/*
	* Основная функция fetch запросов
	* Функция принимает API url и id запроса
	* Функция возвращает Promise с результатом запроса
	*/

	async function getData(url, id = null){
		let requestUrl;

		requestUrl = (id !== null) ? url + id : url;

		let response = await fetch(requestUrl);

			if (response.ok) { // если HTTP-статус в диапазоне 200-299
				let result = await response.json();
				return result;

			} else {
				console.error("Ошибка HTTP: " + response.status);
			}
	}

	/*
	* Функция первичного строения HTML во вкладке "Каталог"
	* Функция принимает массив объектов пользователей
	* Функция строит разметку
	*/

	function constructHtmlFirst(objectArray){
		for (let obj of objectArray){
			listHTML.innerHTML += 
			`
			<div class="content__user-item user-content ">
 				<h4 class="user-content__name js-user-click" data-user-id="${obj.id}">${obj.name}</h4>
 				<div class="user-content__albums js-album-list">

				</div>
			</div>
			`;
		}
	}

	/*
	* Функция вторичного строения HTML во вкладке "Каталог"
	* Функция принимает массив объектов альбомов, id выбранного пользователя, список пользователей
	* Функция вычисляет выбранного пользователя
	* Функция строит разметку списка альбомов у пользователей
	* Функция возвращает массив пользователей, по которым был произведён клик
	*/

	function constructHtmlSecond(objectArray, id, userList){
		let currentUser = [...userList].filter((elem) => elem.getAttribute('data-user-id') == id)[0].closest('.content__user-item').querySelector('.js-album-list');

		for (let obj of objectArray){
			currentUser.innerHTML += 
			`
			<div class="user-content__album-item" >
 				<h5 class="user-content__album-name js-album-click" data-album-id="${obj.id}">${obj.title}</h5>
 				<div class="user-content__photo-list js-photo-list">

				</div>
			</div>
			
			`;
		}
		opensAlbum.push(id);
		return opensAlbum;

	}

	/*
	* Функция третестепенного строения HTML во вкладке "Каталог"
	* Функция принимает массив объектов фотографий, id выбранного альбома, список альбомов
	* Функция вычисляет выбранный альбом
	* Функция строит разметку списка фотографий в альбоме
	* Функция возвращает массив альбомов, по которым был произведён клик
	* В функции задействован прелоадер для более корректного отображения запроса
	*/

	function constructHtmlThird(objectArray, id, albumList){
		
		document.getElementById('preloader').classList.add('open');
		let currentAlbum = [...albumList].filter((elem) => elem.getAttribute('data-album-id') == id)[0].closest('.user-content__album-item').querySelector('.js-photo-list');
		for (let obj of objectArray){
			let favorite = (favoritePhotos.indexOf(obj.id.toString()) !== -1) ? ' active' : '';
			currentAlbum.innerHTML += 
			`
			<div class="user-content__photo-item js-add-to-favorite" data-album-id="${id}"  data-photo-id="${obj.id}" >
				<span class='user-content__star js-click-star ${favorite}'>
				<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
				viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
					<g>
						<g>
							<polygon points="512,197.816 325.961,185.585 255.898,9.569 185.835,185.585 0,197.816 142.534,318.842 95.762,502.431 
								255.898,401.21 416.035,502.431 369.263,318.842 		"/>
						</g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
					<g>
					</g>
			</svg>
		 
		</span>
		  <div class='user-content__photo-wrap js-light-box'>
				<img src="${obj.thumbnailUrl}" data-full-src="${obj.url}" title="${obj.title}" alt="${obj.title}" />
			</div>
		</div>
			
			`;
		}
		opensPhotos.push(id);
		setTimeout(()=>{
			document.getElementById('preloader').classList.remove('open');
		},3000)
		
		return opensPhotos;
	}

	/*
	* Вспомогательная функция
	* Функция принимает массив 
	* Функция возвращает массив уникальных значений
	*/

	function uniqueArray(array) {
		return Array.from(new Set(array));
	}

	/*
	* Функция получений фотографий,добавленных в избранное
	* Функция принимает массив id фотографий и альбомов
	* Функция делает запрос ко всем альбомам 
	* Функция сравнивает полученный результат с id фотографий в LocalStorage
	* Функция приводит массив к массиву уникальных значений
	* Функция возвращает массив объектов избранных фотографий
	*/

	async function getFavoritePhotoData(localPhotos, localAlbums) {

		let arrayPhotos = localPhotos.split('|').filter((photo) => photo != '');
		let arrayAlbums = uniqueArray(localAlbums.split(',').filter((album) => album != ''));
		let favoritePhotos = [];

		for (let album of arrayAlbums){
			let favoriteAlumnsList = await getData(photosUrl,album);
			let tmp_result = await favoriteAlumnsList.filter((photo) => arrayPhotos.indexOf(photo.id.toString()) !== -1)
			favoritePhotos.push(...tmp_result);
		}
		favoritePhotos = uniqueArray(favoritePhotos);
		return favoritePhotos;
	}

	/*
	* Функция строения HTML во вкладке "Избранное"
	* Функция принимает Promise с значениями избранных фотографий и селектор для добавления разметки
	* Функция строит разметку списка избранных фотографий
	* Функция возвращает Promise результата построения разметки
	*/

	function constructHtmlFavorite(promise, selector){
		promise.then(result => {
			selector.innerHTML = '';
			if(result.length > 0){
				for (let obj of result){
					let favorite = (favoritePhotos.indexOf(obj.id.toString()) !== -1) ? ' active' : '';

					selector.innerHTML += 
					`
					<div class="favorite-list__item flex-box js-add-to-favorite" data-album-id="${obj.albumId}"  data-photo-id="${obj.id}">
						<div class='favorite-list__item-photo js-light-box'>
							<img src="${obj.thumbnailUrl}" data-full-src="${obj.url}" title="${obj.title}" alt="${obj.title}" />
						</div>

						<h4 class="favorite-list__item-name ">${obj.title}</h4>
						<span class='favorite-list__item-star js-click-star ${favorite}'>
							<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
								viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
									<g>
										<g>
											<polygon points="512,197.816 325.961,185.585 255.898,9.569 185.835,185.585 0,197.816 142.534,318.842 95.762,502.431 
												255.898,401.21 416.035,502.431 369.263,318.842 		"/>
										</g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
									<g>
									</g>
							</svg>
						
						</span>
					</div>
					`;

				}
			}else{
				selector.innerHTML += '<h3>На данный момент вы не добавили элементов в избранное</h3>'
			}
		})

		let result = new Promise((resolve,reject) => {
			resolve(selector)
		})

		return result
	}

	/*
	* Функция деструкции HTML во вкладке "Каталог"
	* Функция принимает id выбранного пользователя/альбома, список пользователей/альбомов, тип поля(пользователь/альбом)
	* Функция удаляет разметку списка пользователей/альбомов в зависимости от выбранного типа
	*/

	function desctructHtml (id, array, type) {

		switch (type) {
			case 'albums':
				array.filter((elem) => elem.getAttribute('data-album-id') == id)[0].closest('.user-content__album-item').querySelector('.js-photo-list').innerHTML='';
				opensPhotos = opensPhotos.filter((el) => el != id);
				break;

			case 'users':
				array.filter((elem) => elem.getAttribute('data-user-id') == id)[0].closest('.content__user-item').querySelector('.js-album-list').innerHTML='';
				opensAlbum = opensAlbum.filter((el) => el != id);
				break;

			default:
				break; 
		}
	}

	/*
	* Функция добавления асинхронных обработчиков событий для lightBox и функционала избранного
	*/

	async function addCustomEventsHtmlSelector() {

		let photosList =  await document.querySelectorAll('.js-light-box');
		let starsList  =  await document.querySelectorAll('.js-click-star');

		photosList.forEach((photo, idx) => {
			photo.addEventListener('click', function() {

				let fullPhotoUrl = this.querySelector('img').getAttribute('data-full-src');
				let fullPhotoText = this.querySelector('img').getAttribute('title');
				showLightBox(fullPhotoUrl, fullPhotoText);
				
			})
		})

		starsList.forEach((star, idx) => {
			star.addEventListener('click', function() {
				addToFavorite(this);
			})
		})
	}


	/*
	* Функция для отображения LightBox(Модалки с фотографией и именем фото)
	* Функция принимает url на развёрнутую фотография и заголовок фотографии
	* Функция  отображает иодальное окно с полученными данными
	*/

	async function showLightBox (url,title){
		try{
			await lightBoxModal.classList.add('open');
			await lightBoxModal.querySelector('.js-full-image').setAttribute('src', url);
			await lightBoxModal.querySelector('.js-full-image').setAttribute('title', title);
			await lightBoxModal.querySelector('.js-full-image').setAttribute('alt', title);
			lightBoxModal.querySelector('.js-image-title').innerHTML = title;
		}catch (error){
			console.log(error);
		}
	}

	/*
	* Функция добавления/удаления фотографии в избранное
	* Функция текущий элемент, по которому был совершён клик
	* Функция определяет есть ли данное изображение в избранном
	* В зависимости от наличия изображения в избранном - добавляет/удаляет в/из него
	* Функция возвращает функцию, которая получает данные о избранных изображениях
	*/

	async function addToFavorite(element) {

		if(element.classList.contains('active')){
			element.classList.remove('active');
			
		}else{

			element.classList.add('active');
		}

		let photoId = element.closest('.js-add-to-favorite').getAttribute('data-photo-id');
		let albumId = element.closest('.js-add-to-favorite').getAttribute('data-album-id');
		let tmp_array = localStorage.favoritePhotos.split('|');

		tmp_array = tmp_array.filter((photo) => photo != '');

		if(tmp_array.indexOf(photoId.toString()) !== -1){

			tmp_array = tmp_array.filter((elem) => elem !== photoId);

			if(tmp_array.length > 0){
				localStorage.favoritePhotos = tmp_array.join('|') + '|';
				localStorage.favoriteAlbums += albumId + ',';

			}else{
				localStorage.favoritePhotos = '';
			}
			
		}else{
			localStorage.favoritePhotos += photoId + '|';
			localStorage.favoriteAlbums += albumId + ',';
		}

		return getFavoritePhotoData(localStorage.favoritePhotos, localStorage.favoriteAlbums);

	}


	let users = new Promise((resolveUser, rejectUser) => {

		let usersJson = getData(userUrl);
			usersJson.then((resolve) => { 
				usersRes = resolve.filter((item => item.name)); // Запишем массив пользьзователей с наличием имени
				resolveUser(constructHtmlFirst(usersRes));
			})
	});

 /* Ассинхронный код построения структуры пользователей --> Альбомов --> Фотографий */

	users.then((resultUser) => {

		let usersList = document.querySelectorAll('.js-user-click');

		// TODO:  Обработчик кликов по пользователям
		usersList.forEach((val,idx) => {
			val.addEventListener('click', function(){
				this.classList.toggle('open');
				let id = this.getAttribute('data-user-id');
				albums = new Promise ((resolveAlbum,rejectAlbum) => {
					let albumsJson = getData(albumUrl,id);
					albumsJson.then((resolve2) =>{
						albumRes = resolve2;
						
						if(opensAlbum.indexOf(id) == -1){
							resolveAlbum(constructHtmlSecond(albumRes, id, usersList));
						}else{
							desctructHtml(id, [...usersList], 'users');
						}

					})
				})

				albums.then((resultAlbum) => {

					let albumList = document.querySelectorAll('.js-album-click');

					// TODO:  Обработчик кликов по альбомам
					albumList.forEach((val,idx) => {
						val.addEventListener('click', function(){
							this.classList.toggle('open');
			
							let id = this.getAttribute('data-album-id');
							photos = new Promise ((resolvePhotos,rejectPhotos) => {
								let photosJson = getData(photosUrl,id);
								photosJson.then((resolve3) =>{
									let photosRes = resolve3;

									if(opensPhotos.indexOf(id) == -1){
										resolvePhotos(constructHtmlThird(photosRes, id, albumList))
									}else{
										desctructHtml(id, [...albumList], 'albums');
									}
								})
							})

							// TODO:  После построения разметки добавляем ассинхронные обработчики
							photos.then((resolve4) => {
								addCustomEventsHtmlSelector()
							})

						})
					})
				})

			})
		})
	})

});