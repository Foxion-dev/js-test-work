document.addEventListener('DOMContentLoaded', function(){ 

	if(!localStorage.favoritePhotos){
		localStorage.favoritePhotos = ''
	}
	if(!localStorage.favoriteAlbums){
		localStorage.favoriteAlbums = ''
	}
	if(!localStorage.activeTab){
		localStorage.activeTab = '1'
	}
	
	getActiveContentHTML(localStorage.activeTab)

	const albumUrl  = 'https://json.medrating.org/albums?userId=';
	const photosUrl = 'https://json.medrating.org/photos?albumId=';
	const userUrl   = 'https://json.medrating.org/users/';
	const listHTML = document.getElementById('user-list');
	const favoriteHTML = document.getElementById('favorite-list');

	const lightBoxModal = document.getElementById('light-box');
	const closeLightBox = document.querySelector('.close-light-box');

	let tabLinks = document.querySelectorAll('.js-tab-link');

	let albums,photos;

	let opensAlbum = [];
	let opensPhotos = [];
	let favoritePhotos = [];

	favoritePhotos = localStorage.favoritePhotos.split('|');
	favoritePhotos = favoritePhotos.filter((photo) => photo != '');

	let favoritePhotosObjects = getFavoritePhotoData(localStorage.favoritePhotos, localStorage.favoriteAlbums); // делать в момент клика на там избранное
	let favoriteResolve =  constructHtmlFavorite(favoritePhotosObjects, favoriteHTML);

	favoriteResolve.then(html => {
		setTimeout(()=>{
			addCustomEventsHtmlSelector()
		},1500)
	})

	tabLinks.forEach((item,idx) => {
		
		item.addEventListener('click', function (e) {
			e.preventDefault()
			getActiveContentTab(this)
		});
	})

	closeLightBox.addEventListener('click', () => {
		lightBoxModal.classList.remove('open');
	})


	function getActiveContentTab(link) {
			let activeTab = link.getAttribute('data-content-id')
			let contentVariable = [...document.querySelectorAll('.js-content-tab')]
			// let activeContent = contentVariable.filter((content) => content.getAttribute('data-content-id') == activeTab)[0].getAttribute('data-content-id')
			localStorage.activeTab = activeTab

			for(let hideContent of contentVariable){
					hideContent.style.display = 'none';
			}
			
			return getActiveContentHTML(activeTab)
	}

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

	function constructHtmlFirst(object){
		// console.log(object);
		for (let obj of object){
			listHTML.innerHTML += 
			`
			<div class="content__user-item user-content ">
 				<h4 class="user-content__name js-user-click" data-user-id="${obj.id}">${obj.name}</h4>
 				<div class="user-content__albums js-album-list">

				</div>
			</div>
			`;
		}
		// return listHTML;
	}

	function constructHtmlSecond(object, id, userList){
		let currentUser = [...userList].filter((elem) => elem.getAttribute('data-user-id') == id)[0].closest('.content__user-item').querySelector('.js-album-list');

		for (let obj of object){
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

	function constructHtmlThird(object, id, albumList){
		
		document.getElementById('preloader').classList.add('open');
		let currentAlbum = [...albumList].filter((elem) => elem.getAttribute('data-album-id') == id)[0].closest('.user-content__album-item').querySelector('.js-photo-list');
		for (let obj of object){
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

	function uniqueArray(array) {
		return Array.from(new Set(array));
	}

	async function getFavoritePhotoData(localPhotos, localAlbums) {

		let arrayPhotos = localPhotos.split('|').filter((photo) => photo != '');
		let arrayAlbums = uniqueArray(localAlbums.split(',').filter((album) => album != ''));
		let faviritePhotos = [];

		for (let album of arrayAlbums){
			let favoriteAlumnsList = await getData(photosUrl,album);
			let tmp_result = await favoriteAlumnsList.filter((photo) => arrayPhotos.indexOf(photo.id.toString()) !== -1)
			faviritePhotos.push(...tmp_result);
		}

		return faviritePhotos;
	}

	function constructHtmlFavorite(array, selector){
		array.then(result => {
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

	async function addToFavorite(element) {

		if(element.classList.contains('active')){
			element.classList.remove('active');
			
		}else{

			element.classList.add('active');
		}

		let photoId = element.closest('.js-add-to-favorite').getAttribute('data-photo-id');
		let albumId = element.closest('.js-add-to-favorite').getAttribute('data-album-id');
		// console.log(albumId);
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
		// return result;
	}


	let users = new Promise((resolveUser, rejectUser) => {

		let usersJson = getData(userUrl);
			usersJson.then((resolve) => { 
				usersRes = resolve.filter((item => item.name)); // Запишем массив пользьзователей с наличием имени
				resolveUser(constructHtmlFirst(usersRes));
			})
	});


	users.then((resultUser) => {

		let usersList = document.querySelectorAll('.js-user-click');

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