window.onload = contactList;

let addContactBtn: HTMLButtonElement = document.querySelector('.add-cont');
let contList: HTMLDivElement = document.querySelector('.contact-indx');
let givenName: HTMLInputElement = document.querySelector('.name input');
let emailId: HTMLInputElement = document.querySelector('.email input');
let phoneNumber: HTMLInputElement = document.querySelector('.phone input');
let landlineNumber:HTMLInputElement=document.querySelector('.landline input'); 
let category: HTMLInputElement = document.querySelector('.Category select');
let optionBtn: HTMLButtonElement = document.querySelector('.more-option-btn');
let optionContainer: HTMLButtonElement = document.querySelector('.option-container');
let featuresBtn: HTMLButtonElement = document.querySelector('.features .features-btn');
let featuresList: HTMLButtonElement = document.querySelector('.features .features-list');
let sortAlphabetBtn: HTMLButtonElement, sortPhoneNumBtn: HTMLButtonElement;
const categoryRadios = document.querySelectorAll('.category-radio');



const validateEmail = (email: string): RegExpMatchArray | null => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

function contactList(){
    db.load();
    addContactBtn.addEventListener('click', () => {
        const nameValue = givenName.value.trim();
        const emailValue = emailId.value.trim();
        const phoneValue = phoneNumber.value.trim();
        const landlineValue = landlineNumber.value.trim();

        // Check if name and phone number are provided
        if (!nameValue || !phoneValue) {
            alert('Name and phone number are required.');
            return;
        }

        if (db.contactList.some(contact => contact.phoneNumber === phoneValue)) {
            alert('Phone number already exists.');
            return;
        }
    
        if (db.contactList.some(contact => contact.givenName === nameValue)) {
            alert('Name already exists. Names are case-sensitive.');
            return;
        }

        // Validate phone number format (must be 10 digits)
        if (!/^\d{10}$/.test(phoneValue)) {
            alert('Phone number must be 10 digits.');
            return;
        }
        if (landlineValue && !/^\d{3}-\d{3}-\d{4}$/.test(landlineValue)) {
            alert('Invalid landline number format. Use XXX-XXX-XXXX.');
            return;
        }

        // Validate email if provided
        if (emailValue && !validateEmail(emailValue)) {
            alert('Invalid email address.');
            return;
        }

        // If all validations pass, add the contact
        db.addContact(db.getInputVal());
        db.contactIndx();
        clearInputFields();
        alert("Contact added successfully")
    }, false);
}


function clearInputFields() {
    // Clear input fields after successful contact addition
    givenName.value = '';
    emailId.value = '';
    phoneNumber.value = '';
    category.value = 'Others';
    landlineNumber.value='';
}

class Contact {
    givenName: string;
    emailId?: string;
	category:string;
    phoneNumber: string;
    landlineNumber?: string;
    id: string;
	
    constructor(givenName: string, emailId: string,category:string,phoneNumber: string,landlineNumber:string){
        this.givenName = givenName;
        this.emailId = emailId;
		this.category= category;
        this.phoneNumber = phoneNumber;
        this.landlineNumber = landlineNumber;
        this.id = this.generateId();
    }
    private generateId(): string {
        // Generate timestamp
        const timestamp = new Date().getTime().toString(36);

        // Generate random number
        const randomNumber = Math.random().toString(36).substr(2, 5);

        // Combine timestamp and random number to create ID
        return timestamp + randomNumber;
    }
}

class ContactManager {
    contactList: Contact[];
    constructor() {
        this.contactList = [];
    }

    addContact(contact: Contact) {
        this.contactList.push(contact);
        this.save();
    }

    getInputVal(): Contact {
        let person = new Contact(givenName.value,emailId.value,category.value, phoneNumber.value,landlineNumber.value);
        return person;
    }
	filterContacts(searchTerm:string) {
		if (!searchTerm) {
			return db.contactList; // If search term is empty, return all contacts
		}
		searchTerm = searchTerm.toLowerCase();
		return db.contactList.filter(contact =>
			contact.givenName.toLowerCase().includes(searchTerm)
		);
	}

    filterContactsByCategory(category: string): Contact[] {
        if (!category) {
            return this.contactList; // Return all contacts if no category is selected
        }
        return this.contactList.filter(contact => contact.category.toLowerCase() === category.toLowerCase());
    }

    contactIndx(){
        contList.innerHTML = '';
		db.save();
        let table = document.createElement('table'),
            tHead = table.createTHead(),
            tHeadRow = tHead.insertRow(),
            tHeadCell1 = tHeadRow.insertCell(),
            tHeadCell2 = tHeadRow.insertCell(),
            tHeadCell3 = tHeadRow.insertCell(),
            tBody = table.createTBody();

        contList.append(table);
        tHeadCell1.innerHTML = 'Name';
		tHeadCell2.innerHTML = 'Phone';
        tHeadCell3.innerHTML = 'Action';
    

        this.contactList.forEach((current, indx) => {
            let tBodyRow = tBody.insertRow(indx);
            tBodyRow.innerHTML += `<td>${current.givenName}</td><td>${current.phoneNumber}</td><td><div class=
        "btns"><button class="viewBtn" data-contact-id="${current.id}">View</button> <button class="deleteBtn" data-contact-id="${current.id}">Delete</button></div></td>`;
        });

        const viewButtons = document.querySelectorAll('.viewBtn');
        const deleteButtons = document.querySelectorAll('.deleteBtn');
        viewButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                openPopup(this.contactList[index].id);
            });
        });
       deleteButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            if (confirm("Are you sure you want to delete this contact?")) {
                deleteContact(this.contactList[index].id);
            }
        });
    });

        tHeadCell1.classList.add('sort-alphabet');
        sortAlphabetBtn = document.querySelector('table .sort-alphabet');
        sortAlphabetBtn.addEventListener('click', () => {
            this.alphabetSorting();
            this.contactIndx();
            sortAlphabetBtn.classList.add('sort');
            localStorage.setItem('saveContacts', JSON.stringify(this.contactList));
        }, false);
		
    }
    alphabetSorting() {
        this.contactList.sort(ContactManager.sortingByAlphabet);
        updateDisplayedContacts();
    }

    static sortingByAlphabet(p1: Contact, p2: Contact): number {
        if (p1.givenName.toLowerCase() < p2.givenName.toLowerCase()) return -1;
        if (p1.givenName.toLowerCase() > p2.givenName.toLowerCase()) return 1;
        return 0;
    }
		// Save in memory
	save() {
		localStorage.saveContacts = JSON.stringify(this.contactList);
	}
	
		// Load from memory if there's contacts already saved
	load() {
		if (localStorage.saveContacts !== undefined) {
			this.contactList = JSON.parse(localStorage.saveContacts);
			this.contactIndx();
		}
	}
}

function deleteContact(contactId: string) {
    const index = db.contactList.findIndex(contact => contact.id === contactId);
    if (index !== -1) {
        db.contactList.splice(index, 1);
        db.save();
        db.contactIndx();
    }
}

function attachEventListeners() {
    // Add event listeners to view buttons
    const viewButtons = document.querySelectorAll('.viewBtn');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const contactId = button.getAttribute('data-contact-id');
            if (contactId) {
                openPopup(contactId);
            }
        });
    });

    // Add event listeners to delete buttons
    const deleteButtons = document.querySelectorAll('.deleteBtn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const contactId = button.getAttribute('data-contact-id');
            if (contactId && confirm("Are you sure you want to delete this contact?")) {
                deleteContact(contactId);
            }
        });
    });
}


const searchInput = document.getElementById('searchInput') as HTMLInputElement;
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    console.log(db.filterContacts(searchTerm))
    displayContacts(db.filterContacts(searchTerm));
});
interface contactDet{
    givenName: string,
    emailId?: string,
	category:string,
    phoneNumber: string
    landlineNumber?: string;
    id: string;
}
// Update contact display based on filtered list
function displayContacts(contacts: contactDet[]) {
    contList.innerHTML = '';
    let table = document.createElement('table'),
        tHead = table.createTHead(),
        tHeadRow = tHead.insertRow(),
        tHeadCell1 = tHeadRow.insertCell(),
        tHeadCell2 = tHeadRow.insertCell(),
        tHeadCell3 = tHeadRow.insertCell(),
        tBody = table.createTBody();

    contList.append(table);
    tHeadCell1.innerHTML = 'Name';
    tHeadCell2.innerHTML = 'Phone';
    tHeadCell3.innerHTML = 'Action';
    if(contacts.length===0){
        let tBodyRow = tBody.insertRow(0);
        let tBodyCell = tBodyRow.insertCell(0);
        tBodyCell.colSpan = 3;
        tBodyCell.innerHTML = '<p class="noprod">There are no contacts for this particular filteration.</p>';

    }
    else{
    contacts.forEach((current, indx) => {
        let tBodyRow = tBody.insertRow(indx);
        tBodyRow.innerHTML += `<td>${current.givenName}</td><td>${current.phoneNumber}</td><td><div class=
        "btns"><button class="viewBtn" data-contact-id="${current.id}">View</button> <button class="deleteBtn" data-contact-id="${current.id}">Delete</button></div></td>`;
    });

    attachEventListeners();
    }
}
function populateInputFields(contact: contactDet) {
    givenName.value = contact.givenName;
    emailId.value = contact.emailId || ''; // Use empty string if email is undefined
    phoneNumber.value = contact.phoneNumber;
    category.value = contact.category;
    landlineNumber.value = contact.landlineNumber || ''; // Use empty string if landline number is undefined
}


// Add event listener to search input
searchInput.addEventListener('input', () => {
    updateDisplayedContacts();
});

// Add event listeners to category radio buttons
categoryRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        updateDisplayedContacts();
    });
});

let db = new ContactManager();
// Initial display of contacts
updateDisplayedContacts();

function updateDisplayedContacts() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = getSelectedCategory();

    let filteredContacts = db.contactList;

    // Filter contacts based on search term
    if (searchTerm) {
        filteredContacts = filteredContacts.filter(contact =>
            contact.givenName.toLowerCase().includes(searchTerm) || contact.emailId.toLowerCase().includes(searchTerm) ||  contact.phoneNumber.toLowerCase().includes(searchTerm)
        );
    }

    // Filter contacts based on selected category
    if (selectedCategory && selectedCategory !== 'all') {
        filteredContacts = filteredContacts.filter(contact =>
            contact.category.toLowerCase() === selectedCategory.toLowerCase()
        );
    }

    // Display filtered contacts
    displayContacts(filteredContacts);
}

function getSelectedCategory() {
    for (const radio of categoryRadios) {
        if ((radio as HTMLInputElement).checked) {
            return (radio as HTMLInputElement).value;
        }
    }
    return 'all'; // Default to 'all' if no category selected
}


// Filter contact list based on search term

// Declare ContactManger class
// Open popup and populate with contact details
function openPopup(contactId: string) {
    const popup: HTMLElement | null = document.getElementById('popup');
    const nameInput: HTMLInputElement | null = document.getElementById('popup-name') as HTMLInputElement;
    const emailInput: HTMLInputElement | null = document.getElementById('popup-email') as HTMLInputElement;
    const phoneInput: HTMLInputElement | null = document.getElementById('popup-phone') as HTMLInputElement;
    const categoryInput: HTMLInputElement | null = document.getElementById('popup-category') as HTMLInputElement;
    const landlineInput: HTMLInputElement | null = document.getElementById('popup-landline') as HTMLInputElement;
    const saveButton: HTMLButtonElement | null = document.getElementById('popup-save') as HTMLButtonElement;
    const body: HTMLElement | null = document.querySelector('body');

    const popUpBox = document.querySelector('.pop-up-box') as HTMLElement;
    popUpBox.style.visibility = 'visible';

    if (popup && nameInput && emailInput && phoneInput && categoryInput && landlineInput && saveButton) {
        // Find the contact by ID
        const contact = db.contactList.find(c => c.id === contactId);
        if (contact) {
            nameInput.value = contact.givenName;
            emailInput.value = contact.emailId || '';
            phoneInput.value = contact.phoneNumber;
            categoryInput.value = contact.category;
            landlineInput.value = contact.landlineNumber || '';

            popup.style.display = 'block';
            popup.style.top = '50%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
            body.style.overflow = 'hidden';

            // Add event listener to save button
            saveButton.addEventListener('click', () => {
                const editedName = nameInput.value.trim();
                const editedEmail = emailInput.value.trim();
                const editedPhone = phoneInput.value.trim();
                const editedLandline = landlineInput.value.trim();
            
                // Check if name and phone number are provided
                if (!editedName || !editedPhone) {
                    alert('Name and phone number are required.');
                    return;
                }
            
                // Validate phone number format (must be 10 digits)
                if (!/^\d{10}$/.test(editedPhone)) {
                    alert('Phone number must be 10 digits.');
                    return;
                }
            
                // Validate email if provided
                if (editedEmail && !validateEmail(editedEmail)) {
                    alert('Invalid email address.');
                    return;
                }
            
                // Validate landline number format if provided
                if (editedLandline && !/^\d{3}-\d{3}-\d{4}$/.test(editedLandline)) {
                    alert('Invalid landline number format. Use XXX-XXX-XXXX.');
                    return;
                }


                 if (db.contactList.some(contact => contact.id !== contactId && contact.givenName === editedName)) {
                    alert('Another contact already exists with this name. Please change the name.');
                    return;
                 }

                // Check for duplicate phone number (excluding the current contact being edited)
                if (db.contactList.some(contact => contact.id !== contactId && contact.phoneNumber === editedPhone)) {
                    alert('Another contact already exists with this phone number. Please change the phone number.');
                    return;
                }
                contact.givenName = nameInput.value;
                contact.emailId = emailInput.value;
                contact.phoneNumber = phoneInput.value;
                contact.category = categoryInput.value;
                contact.landlineNumber = landlineInput.value;

                // Save changes to local storage
                db.save();

                // Close popup
                closePopup();
                location.reload();
            });
        }
    }
}


// Close popup function
function closePopup() {
    const popup: HTMLElement | null = document.getElementById('popup');
    const popUpBox = document.querySelector('.pop-up-box') as HTMLElement;
    popUpBox.style.visibility = 'hidden'
    if (popup) {
        popup.style.display = 'none';
        const body: HTMLElement | null = document.querySelector('body');
        body.style.overflow = '';
    }
}

// Close popup when close button or popup background is clicked
document.addEventListener('click', function(event: MouseEvent) {
    const closeBtn: HTMLElement | null = document.getElementById('popup-close');
    const popup: HTMLElement | null = document.getElementById('popup');
    if (popup && closeBtn && (event.target === closeBtn || event.target === popup)) {
        closePopup();
    }
});


