## Overview
PetBasket is a web application designed to help match users with their ideal pet! It's free to join, and users may search for pets in their area that are available for adoption based on type (dog or cat), age, and gender. It also features a Classifieds/Listings feature where shelters, organizations or individuals can upload a photo and information of pet(s) they have available for adoption. 

## The Team
* **[Jason Li](https://github.com/2monsta)**: 
	* **Primary team role**: Backend Routing
  	* **Contributions**:  Registration/Login Authentication,Database 
  	* **Key code portions**: User Authentication, Search, Favorites

* **[Binh Chung](https://github.com/binhc)**: 
	* **Primary team role**: Backend Routing, UX
  	* **Contributions**: Flow Chart, WireFrame, Database, Account Management, Gif Creator 
  	* **Key code portions**: Profile, Navbar, Classified Listings 

* **[Jong Park](https://github.com/maclay13531)**:
	 * **Primary team role**: text text text
  	* **Contributions**:  text text text 
  	* **Key code portions**: text text text 

* **[Jennifer Menze](https://github.com/jamenze)**: 
  	* **Primary team role**: "#26a69a Enthusiast"
  	* **Contributions**:  technical writing, styling, branding
  	* **Key code portions**: README.md, layout design, CSS/HTML

## Programming Languages used
* EJS View Engine
* Materialize CSS
* JavaScript
* jQuery
* Node.js/Express.js
* Auth0
* MySQL
* Socket.io

## Database used
* [RescueGroups](rescuegroups.org)
* Custom Database

## MVP (Minimum Viable Product)
* User can register, log in, and search for pets that are available for adoption.
* Users can upload information and photo(s) of pets available for adoption.

## Demo
![Project Screen Shot](public/images/petBasketDemo.gif)


## Wild Card Route/Global Variable
```
router.all("/*", (req,res,next)=>{
	if(req.session.uid == undefined){
		console.log("you are not loggedin");
		next();
	}else if(req.session.uid != undefined){
		console.log("YOU ARE LOGGEDIN");
		res.locals.firstNameTest = req.session.fname;
		res.locals.lastNameTest = req.session.lname;
		res.locals.emailTest = req.session.email;
		res.locals.profileimgTest = req.session.profileimg;
		res.locals.uidTest = req.session.uid;
		res.locals.phoneTest = req.session.phone
		next();
	}
});
```
## 3 Contributions We’d Like to See
1. Allow users to search by pet microchip, vaccination, and temperament status
2. Combine both uploads table and pets table in our own database
3. Auto update our database from RescueGroups
4. Refactor our code to make use of functions correctly
5. Need to loop through upload to get pictures

## [View a live demo of PetBasket!](https://www.google.com)
