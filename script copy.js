const APP_SCRIPT_USER_URL = "https://script.google.com/macros/s/AKfycbybxSiz6G38-_3KYOPTK50-DdjbkymdC1aP37C6NWPAAeQrmijYAetyHIM7VivEukm8/exec?sheetname=user";
const APP_SCRIPT_PACKAGE_URL = "https://script.google.com/macros/s/AKfycbybxSiz6G38-_3KYOPTK50-DdjbkymdC1aP37C6NWPAAeQrmijYAetyHIM7VivEukm8/exec?sheetname=package";
const APP_SCRIPT_POST_URL = "https://script.google.com/macros/s/AKfycbybxSiz6G38-_3KYOPTK50-DdjbkymdC1aP37C6NWPAAeQrmijYAetyHIM7VivEukm8/exec";

// Admin Login Verification
document.addEventListener("DOMContentLoaded", function() {
    if (document.querySelector("#loginForm")) {
        document.getElementById("loginForm").addEventListener("submit", loginAdmin);
        checkAdminSession();
    } else if (document.querySelector("#packageTable")) {
        checkAdminSession();
    }
});

function loginAdmin(event) {
    event.preventDefault();
    let username = document.getElementById("adminUsername").value.trim();
    let password = document.getElementById("adminPassword").value.trim();
    
    fetch(APP_SCRIPT_USER_URL)
        .then(response => response.json())
        .then(data => {
            let user = data.find(row => row.username === username && row.password === password);
            if (user) {
                sessionStorage.setItem("loggedInAdmin", username);
                showAdminDashboard();
            } else {
                alert("Invalid credentials!");
            }
        })
        .catch(error => console.error("Error fetching user data:", error));
}

function checkAdminSession() {
    let loggedInAdmin = sessionStorage.getItem("loggedInAdmin");
    if (loggedInAdmin) {
        showAdminDashboard();
    }
}

function showAdminDashboard() {
    let loggedInAdmin = sessionStorage.getItem("loggedInAdmin");
    document.getElementById("adminUsernameDisplay").textContent = loggedInAdmin;
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("dashboardSection").style.display = "block";
    loadPackages(loggedInAdmin);
}

function showAddPackageModal() {
    document.getElementById("addPackageModal").style.display = "block";
}

function hideAddPackageModal() {
    document.getElementById("addPackageModal").style.display = "none";
}


// Logout Admin
function logoutAdmin() {
    sessionStorage.removeItem("loggedInAdmin");
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("dashboardSection").style.display = "none";
}

// Load Admin Packages
function loadPackages(adminUsername) {
    fetch(APP_SCRIPT_PACKAGE_URL)
        .then(response => response.json())
        .then(data => {
            let filteredData = data.filter(row => row.username === adminUsername);
            let tableBody = document.getElementById("packageTable");
            tableBody.innerHTML = "";
            filteredData.forEach(pkg => {
                let row = `<tr>
                              <td>${pkg.trackingNumber}</td>
                              <td>${pkg.sender}</td>
                              <td>${pkg.receiver}</td>
                              <td>${pkg.status}</td>
                              ${pkg.status !== "DELIVERED" && pkg.status !== "RETURNED" ? `<td><button onclick="addDays('${pkg.trackingNumber}')">+</button></td>` : ""}
                              <td><button onclick="deletePackage('${pkg.trackingNumber}')">🗑</button></td>
                           </tr>`;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => console.error("Error fetching package data:", error));
}

// Add Package
function addPackage(event) {
    event.preventDefault();
    let loggedInAdmin = sessionStorage.getItem("loggedInAdmin"); // Get logged-in admin username
    if (!loggedInAdmin) {
        alert("You must be logged in to add a package.");
        return;
    }

    let payload = new URLSearchParams();
    payload.append("action", "addPackage");
    payload.append("id", document.getElementById("packageId").value.trim());
    payload.append("sendDateTime", new Date().toISOString());
    payload.append("deliveryType", document.getElementById("deliveryType").value.trim());
    payload.append("itemType", document.getElementById("itemType").value.trim());
    payload.append("senderName", document.getElementById("sender").value.trim());
    payload.append("senderPhone", document.getElementById("senderPhone").value.trim());
    payload.append("senderEmail", document.getElementById("senderEmail").value.trim());
    payload.append("senderAddress", document.getElementById("senderAddress").value.trim());
    payload.append("senderNote", document.getElementById("senderNote").value.trim());
    payload.append("receiverName", document.getElementById("receiver").value.trim());
    payload.append("receiverPhone", document.getElementById("receiverPhone").value.trim());
    payload.append("receiverEmail", document.getElementById("receiverEmail").value.trim());
    payload.append("receiverAddress", document.getElementById("receiverAddress").value.trim());
    payload.append("username", loggedInAdmin);  // Include logged-in admin's username

    console.log("Sending Payload for addPackage:", payload.toString());

    fetch(APP_SCRIPT_POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString()
    })
    .then(response => response.json())
    .then(data => {
        console.log("Response Data:", data);
        loadPackages(loggedInAdmin);
    })
    .catch(error => console.error("Error adding package:", error));
}

// Add Days
function addDays(trackingNumber) {
    let additionalDays = prompt("Enter additional days:");
    let delayReason = prompt("Enter delay reason:");
    if (!additionalDays || !delayReason) return;

    let payload = new URLSearchParams();
    payload.append("action", "addDays");
    payload.append("trackingNumber", trackingNumber);
    payload.append("additionalDays", additionalDays);
    payload.append("delayReason", delayReason);

    console.log("Sending Payload for addDays:", payload.toString());

    fetch(APP_SCRIPT_POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString()
    })
    .then(response => response.json())
    .then(data => {
        console.log("Response Data:", data);
        loadPackages(sessionStorage.getItem("loggedInAdmin"));
    })
    .catch(error => console.error("Error adding days:", error));
}

// Delete Package
function deletePackage(trackingNumber) {
    if (!confirm("Are you sure you want to delete this package?")) return;

    let payload = new URLSearchParams();
    payload.append("action", "deletePackage");
    payload.append("trackingNumber", trackingNumber);

    console.log("Sending Payload for deletePackage:", payload.toString());

    fetch(APP_SCRIPT_POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString()
    })
    .then(response => response.json())
    .then(data => {
        console.log("Response Data:", data);
        loadPackages(sessionStorage.getItem("loggedInAdmin"));
    })
    .catch(error => console.error("Error deleting package:", error));
}



// User Tracking
document.addEventListener('DOMContentLoaded', function() {
    const trackingInput = document.getElementById('trackingInput');
    const trackButton = document.querySelector('.btn-parcels');
    const spinner = trackButton.querySelector('.fa-spinner');
    const binoculars = trackButton.querySelector('.fa-binoculars');

    trackingInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            trackPackage();
        }
    });

    trackButton.addEventListener('click', trackPackage);

    function trackPackage() {
        // Add loading style and disable button
        spinner.style.display = 'inline-block';
        binoculars.style.display = 'none';
        trackButton.disabled = true;

        // Your existing tracking logic here
        let trackingId = trackingInput.value.trim();
        fetch(APP_SCRIPT_PACKAGE_URL)
            .then(response => response.json())
            .then(data => {
                let package = data.find(pkg => pkg.trackingNumber === trackingId);
                let resultDiv = document.getElementById("trackingResult");
                if (package) {
                    resultDiv.innerHTML = `<p><strong>Tracking ID:</strong> ${package.trackingNumber}</p>
                                        <p><strong>Status:</strong> ${package.status}</p>`;
                } else {
                    resultDiv.innerHTML = `<p style="color:red;">Package not found.</p>`;
                }
            })
            .catch(error => console.error("Error fetching tracking data:", error))
            .finally(() => {
                // Remove loading style and enable button
                spinner.style.display = 'none';
                binoculars.style.display = 'inline-block';
                trackButton.disabled = false;
            });
    }
});




const translations = {
    "en": {
        "pageTitle": "Universal Parcel Tracking - Global Package Tracking",
        "title": "Global Package Tracking",
        "description": "We support tracking for most major carriers. Enter your tracking number to begin.",
        "track": "Track package",
        "switchNav": "Switch navigation",
        "brand": "Parcels",
        "language": "English",
        "english": "English",
        "german": "German",
        "french": "French",
        "italian": "Italian",
        "spanish": "Spanish",
        "portuguese": "Portuguese",
        "swedish": "Swedish",
        "dutch": "Dutch",
        "korean": "Korean",
        "indonesian": "Indonesian",
        "russian": "Russian",
        "chooseCountry": "Choose country",
        "faq1Title": "Track any package, freight and shipment",
        "faq1Text": "Want to know where your package is? Our platform saves you time by automatically checking the websites of postal, courier, and logistics companies on your behalf. To track your parcel, you only need the tracking number.",
        "faq2Title": "What is a tracking number?",
        "faq2Text": "A tracking number or tracking code is a unique identifier assigned to each package, allowing you to monitor its movement between countries or even within a country. Tracking numbers can be international or traceable only within the sender's country. The tracking number in the format of the Universal Postal Union looks like RA123456789CN, where the first 2 letters indicate the type of package and the last 2 letters are the code of the country of origin. Packages with such numbers can be tracked until delivery. Other shipments may be delivered by courier, transport, and logistics companies, and their tracking codes can vary significantly: CTAFT0000160477YQ, UPAAB000000251682107, AEL10105033654UA, SGADN143797855. These packages are not always trackable in the recipient's country, and you may need to await notification from the Post Office or a call from the courier company.",
        "faq3Title": "How to track a parcel from an online store?",
        "faq3Text": "Wait for the order to be shipped. The seller will reserve a tracking number from the delivery service, which becomes trackable within 1-5 days after the order is transferred. Track the parcel using the tracking number. Note that the order number is different and cannot be used for tracking. An exception is ASOS, where you can track ASOS orders by order number on our platform.",
        "faq4Title": "Can't track package for a long time?",
        "faq4Text": "Do not panic if the package isn't trackable immediately after receiving the tracking number. The postal or courier company requires time to process the parcel, weigh it, prepare customs documents, sort it, and forward it. If it remains untrackable after 7 days, the seller may not have shipped the parcel and only reserved the tracking number.",
        "faq5Title": "Tracking eBay order",
        "faq5Text": "eBay sellers use various delivery and postal companies depending on the item price and shipping method. We support SpeedPAK, Pitney Bowes, Global Shipping Program, China Post, Winit, Yanwen, and more. Read our guide to tracking eBay orders.",
        "faq6Title": "Delivery time",
        "faq6Text": "Estimate the arrival time of your order to the United States, UK, Canada, Australia, or any other country with our delivery time estimation algorithm. We collect delivery time statistics for each package entering each country and city to provide the most accurate estimated arrival date.",
        "download": "Download",
        "downloadApp": "Download the Parcels app for iPhone or Android to always know where your packages are, and get Push notifications when package tracking changes.",
        "up": "Up",
        "byTisunov": "by tisunov",
        "footerText": "Parcels offers a comprehensive package tracking app. Download it for iOS or Android.",
        "trademarkDisclaimer": "All logos, product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them. This site and the products and services offered on this site are not associated, affiliated, endorsed, or sponsored by any business listed on this page nor have they been reviewed tested or certified by any other company listed on this page.",
        "privacyPolicy": "Privacy Policy",
        "trackingButton": "Tracking Button",
        "apiDocs": "API Docs"
    },
    "de": {
        "pageTitle": "Universal Parcel Tracking - Globale Paketverfolgung",
        "title": "Globale Paketverfolgung",
        "description": "Wir unterstützen die Sendungsverfolgung für die meisten großen Versandunternehmen. Geben Sie Ihre Sendungsverfolgungsnummer ein, um zu beginnen.",
        "track": "Paket verfolgen",
        "switchNav": "Navigation umschalten",
        "brand": "Pakete",
        "language": "Deutsch",
        "english": "Englisch",
        "german": "Deutsch",
        "french": "Französisch",
        "italian": "Italienisch",
        "spanish": "Spanisch",
        "portuguese": "Portugiesisch",
        "swedish": "Schwedisch",
        "dutch": "Niederländisch",
        "korean": "Koreanisch",
        "indonesian": "Indonesisch",
        "russian": "Russisch",
        "chooseCountry": "Land auswählen",
        "faq1Title": "Verfolgen Sie jedes Paket, Fracht und Sendung",
        "faq1Text": "Möchten Sie wissen, wo sich Ihr Paket befindet? Unsere Plattform spart Ihnen Zeit, indem sie automatisch die Websites von Post-, Kurier- und Logistikunternehmen in Ihrem Namen überprüft. Um Ihr Paket zu verfolgen, benötigen Sie nur die Sendungsverfolgungsnummer.",
        "faq2Title": "Was ist eine Sendungsverfolgungsnummer?",
        "faq2Text": "Eine Sendungsverfolgungsnummer oder ein Sendungsverfolgungscode ist eine eindeutige Kennung, die jedem Paket zugewiesen wird und mit der Sie die Bewegung des Pakets zwischen Ländern oder sogar innerhalb eines Landes überwachen können. Sendungsverfolgungsnummern können international sein oder nur innerhalb des Landes des Absenders nachverfolgbar sein. Die Sendungsverfolgungsnummer im Format des Weltpostvereins sieht aus wie RA123456789CN, wobei die ersten 2 Buchstaben die Art des Pakets und die letzten 2 Buchstaben der Code des Ursprungslandes sind. Pakete mit solchen Nummern können bis zur Zustellung verfolgt werden. Andere Sendungen können von Kurier-, Transport- und Logistikunternehmen zugestellt werden, und das Aussehen der Sendungsverfolgungscodes kann sehr unterschiedlich sein: CTAFT0000160477YQ, UPAAB000000251682107, AEL10105033654UA, SGADN143797855. Solche Pakete sind im Empfängerland nicht immer verfolgbar, und Sie müssen auf eine Benachrichtigung von der Post oder einen Anruf von einem Kurierunternehmen warten.",
        "faq3Title": "Wie verfolge ich ein Paket aus einem Online-Shop?",
        "faq3Text": "Warten Sie, bis die Bestellung versandt wurde. Der Verkäufer reserviert eine Sendungsverfolgungsnummer vom Zustelldienst, die innerhalb von 1-5 Tagen nach Übergabe der Bestellung an den Zustelldienst verfolgt werden kann. Verfolgen Sie das Paket anhand der Sendungsverfolgungsnummer. Beachten Sie, dass die Bestellnummer unterschiedlich ist und nicht zur Verfolgung verwendet werden kann. Eine Ausnahme bildet ASOS, wo Sie ASOS-Bestellungen anhand der Bestellnummer auf unserer Plattform verfolgen können.",
        "faq4Title": "Kann das Paket längere Zeit nicht verfolgen?",
        "faq4Text": "Keine Panik, wenn das Paket nicht sofort nach Erhalt der Sendungsverfolgungsnummer verfolgbar ist. Das Post- oder Kurierunternehmen benötigt Zeit, um das Paket zu arrangieren, zu wiegen, Zolldokumente vorzubereiten, zu sortieren und das Paket weiterzuleiten. Wenn es nach 7 Tagen nicht mehr verfolgbar ist, hat der Verkäufer das Paket möglicherweise nicht versandt und nur die Sendungsverfolgungsnummer reserviert.",
        "faq5Title": "eBay-Bestellung verfolgen",
        "faq5Text": "eBay-Verkäufer verwenden je nach Artikelpreis und Versandart verschiedene Zustell- und Postunternehmen. Wir unterstützen SpeedPAK, Pitney Bowes, Global Shipping Program, China Post, Winit, Yanwen und mehr. Lesen Sie unseren Leitfaden zur Verfolgung von eBay-Bestellungen.",
        "faq6Title": "Lieferzeit",
        "faq6Text": "Schätzen Sie die Ankunftszeit Ihrer Bestellung in den Vereinigten Staaten, Großbritannien, Kanada, Australien oder einem anderen Land mit unserem Algorithmus zur Schätzung der Lieferzeit. Wir sammeln Lieferzeitstatistiken für jedes Paket, das in jedes Land und jede Stadt eingeht, um das genaueste geschätzte Ankunftsdatum zu liefern.",
        "download": "Herunterladen",
        "downloadApp": "Laden Sie die Parcels-App für iPhone oder Android herunter, um immer zu wissen, wo sich Ihre Pakete befinden, und erhalten Sie Push-Benachrichtigungen, wenn sich die Paketverfolgung ändert.",
        "up": "Nach oben",
        "byTisunov": "von tisunov",
        "footerText": "Parcels bietet eine umfassende App zur Paketverfolgung. Laden Sie sie für iOS oder Android herunter.",
        "trademarkDisclaimer": "Alle Logos, Produkt- und Firmennamen sind Warenzeichen™ oder eingetragene® Warenzeichen ihrer jeweiligen Inhaber. Die Verwendung von ihnen impliziert keine Zugehörigkeit zu oder Billigung durch sie. Diese Website und die auf dieser Website angebotenen Produkte und Dienstleistungen sind nicht mit einem auf dieser Seite aufgeführten Unternehmen verbunden, verbunden, unterstützt oder gesponsert und wurden von keinem anderen auf dieser Seite aufgeführten Unternehmen überprüft, getestet oder zertifiziert.",
        "privacyPolicy": "Datenschutzbestimmungen",
        "trackingButton": "Tracking-Button",
        "apiDocs": "API-Dokumente"
    },
    "fr": {
        "pageTitle": "Suivi de colis universel - Suivi de colis mondial",
        "title": "Suivi de colis mondial",
        "description": "Nous prenons en charge le suivi pour la plupart des principaux transporteurs. Entrez votre numéro de suivi pour commencer.",
        "track": "Suivre le colis",
        "switchNav": "Basculer la navigation",
        "brand": "Colis",
        "language": "Français",
        "english": "Anglais",
        "german": "Allemand",
        "french": "Français",
        "italian": "Italien",
        "spanish": "Espagnol",
        "portuguese": "Portugais",
        "swedish": "Suédois",
        "dutch": "Néerlandais",
        "korean": "Coréen",
        "indonesian": "Indonésien",
        "russian": "Russe",
        "chooseCountry": "Choisir le pays",
        "faq1Title": "Suivre tout colis, fret et envoi",
        "faq1Text": "Vous voulez savoir où se trouve votre colis ? Notre plateforme vous fait gagner du temps en vérifiant automatiquement les sites web des entreprises postales, de messagerie et de logistique en votre nom. Pour suivre votre colis, vous n'avez besoin que du numéro de suivi.",
        "faq2Title": "Qu'est-ce qu'un numéro de suivi ?",
        "faq2Text": "Le numéro de suivi ou le code de suivi est un identifiant unique attribué à chaque colis, vous permettant de suivre son mouvement entre les pays ou même au sein d'un même pays. Les numéros de suivi peuvent être internationaux ou traçables uniquement dans le pays de l'expéditeur. Le numéro de suivi au format de l'Union postale universelle ressemble à RA123456789CN, où les 2 premières lettres indiquent le type de colis et les 2 dernières lettres sont le code du pays d'origine. Les colis avec de tels numéros peuvent être suivis jusqu'à la livraison. D'autres envois peuvent être livrés par des entreprises de messagerie, de transport et de logistique, et l'apparence des codes de suivi peut varier considérablement : CTAFT0000160477YQ, UPAAB000000251682107, AEL10105033654UA, SGADN143797855. Ces colis ne sont pas toujours traçables dans le pays du destinataire, et vous devrez peut-être attendre une notification du bureau de poste ou un appel d'une entreprise de messagerie.",
        "faq3Title": "Comment suivre un colis depuis une boutique en ligne ?",
        "faq3Text": "Attendez que la commande soit expédiée. Le vendeur réservera un numéro de suivi auprès du service de livraison, qui deviendra traçable dans les 1 à 5 jours suivant le transfert de la commande. Suivez le colis à l'aide du numéro de suivi. Notez que le numéro de commande est différent et ne peut pas être utilisé pour le suivi. Une exception est ASOS, où vous pouvez suivre les commandes ASOS par numéro de commande sur notre plateforme.",
        "faq4Title": "Impossible de suivre le colis pendant longtemps ?",
        "faq4Text": "Ne paniquez pas si le colis n'est pas traçable immédiatement après avoir reçu le numéro de suivi. L'entreprise postale ou de messagerie a besoin de temps pour traiter le colis, le peser, préparer les documents douaniers, le trier et le faire suivre. S'il reste introuvable après 7 jours, il se peut que le vendeur n'ait pas expédié le colis et n'ait réservé que le numéro de suivi.",
        "faq5Title": "Suivre une commande eBay",
        "faq5Text": "Les vendeurs eBay utilisent diverses entreprises de livraison et postales en fonction du prix de l'article et du mode d'expédition. Nous prenons en charge SpeedPAK, Pitney Bowes, Global Shipping Program, China Post, Winit, Yanwen, etc. Consultez notre guide pour suivre les commandes eBay.",
        "faq6Title": "Délai de livraison",
        "faq6Text": "Estimez le délai d'arrivée de votre commande aux États-Unis, au Royaume-Uni, au Canada, en Australie ou dans tout autre pays grâce à notre algorithme d'estimation du délai de livraison. Nous recueillons des statistiques sur les délais de livraison pour chaque colis entrant dans chaque pays et chaque ville afin de fournir la date d'arrivée estimée la plus précise.",
        "download": "Télécharger",
        "downloadApp": "Téléchargez l'application Parcels pour iPhone ou Android pour toujours savoir où se trouvent vos colis et recevoir des notifications push lorsque le suivi des colis change.",
        "up": "Haut",
        "byTisunov": "par tisunov",
        "footerText": "Parcels propose une application complète de suivi des colis. Téléchargez-la pour iOS ou Android.",
        "trademarkDisclaimer": "Tous les logos, noms de produits et de sociétés sont des marques commerciales™ ou des marques déposées® de leurs détenteurs respectifs. Leur utilisation n'implique aucune affiliation ou approbation de leur part. Ce site et les produits et services proposés sur ce site ne sont associés, affiliés, approuvés ou sponsorisés par aucune entreprise répertoriée sur cette page et n'ont pas été examinés, testés ou certifiés par une autre entreprise répertoriée sur cette page.",
        "privacyPolicy": "Politique de confidentialité",
        "trackingButton": "Bouton de suivi",
        "apiDocs": "Documents API"
    },
    "it": {
        "pageTitle": "Tracciamento universale dei pacchi - Tracciamento globale dei pacchi",
        "title": "Tracciamento globale dei pacchi",
        "description": "Supportiamo il tracciamento per la maggior parte dei principali corrieri. Inserisci il tuo numero di tracciamento per iniziare.",
        "track": "Traccia pacco",
        "switchNav": "Cambia navigazione",
        "brand": "Pacchi",
        "language": "Italiano",
        "english": "Inglese",
        "german": "Tedesco",
        "french": "Francese",
        "italian": "Italiano",
        "spanish": "Spagnolo",
        "portuguese": "Portoghese",
        "swedish": "Svedese",
        "dutch": "Olandese",
        "korean": "Coreano",
        "indonesian": "Indonesiano",
        "russian": "Russo",
        "chooseCountry": "Scegli il paese",
        "faq1Title": "Traccia qualsiasi pacco, spedizione e spedizione",
        "faq1Text": "Vuoi sapere dove si trova il tuo pacco? La nostra piattaforma ti fa risparmiare tempo controllando automaticamente i siti web delle aziende postali, di corriere e di logistica per tuo conto. Per tracciare il tuo pacco, hai bisogno solo del numero di tracciamento.",
        "faq2Title": "Cos'è un numero di tracciamento?",
        "faq2Text": "Il numero di tracciamento o il codice di tracciamento è un identificatore univoco assegnato a ciascun pacco, che ti consente di monitorare il suo movimento tra i paesi o anche all'interno di un singolo paese. I numeri di tracciamento possono essere internazionali o tracciabili solo all'interno del paese del mittente. Il numero di tracciamento nel formato dell'Unione postale universale assomiglia a RA123456789CN, dove le prime 2 lettere indicano il tipo di pacco e le ultime 2 lettere sono il codice del paese di origine. I pacchi con tali numeri possono essere tracciati fino alla consegna. Altre spedizioni possono essere consegnate da corrieri, società di trasporto e logistica e l'aspetto dei codici di tracciamento può variare notevolmente: CTAFT0000160477YQ, UPAAB000000251682107, AEL10105033654UA, SGADN143797855. Tali pacchi non sono sempre tracciabili nel paese del destinatario e dovrai attendere una notifica dall'ufficio postale o una chiamata da una società di corriere.",
        "faq3Title": "Come tracciare un pacco da un negozio online?",
        "faq3Text": "Attendi che l'ordine venga spedito. Il venditore riserverà un numero di tracciamento dal servizio di consegna, che diventerà tracciabile entro 1-5 giorni dopo il trasferimento dell'ordine. Traccia il pacco utilizzando il numero di tracciamento. Tieni presente che il numero dell'ordine è diverso e non può essere utilizzato per il tracciamento. Un'eccezione è ASOS, dove puoi tracciare gli ordini ASOS tramite il numero dell'ordine sulla nostra piattaforma.",
        "faq4Title": "Impossibile tracciare il pacco per molto tempo?",
        "faq4Text": "Non farti prendere dal panico se il pacco non è tracciabile subito dopo aver ricevuto il numero di tracciamento. La società postale o di corriere impiega del tempo per elaborare il pacco, pesarlo, preparare i documenti doganali, smistarlo e inoltrarlo. Se rimane non tracciabile dopo 7 giorni, è possibile che il venditore non abbia spedito il pacco e abbia riservato solo il numero di tracciamento.",
        "faq5Title": "Traccia l'ordine eBay",
        "faq5Text": "I venditori eBay utilizzano varie società di consegna e postali a seconda del prezzo dell'articolo e del metodo di spedizione. Supportiamo SpeedPAK, Pitney Bowes, Global Shipping Program, China Post, Winit, Yanwen e altri. Leggi la nostra guida per tracciare gli ordini eBay.",
        "faq6Title": "Tempo di consegna",
        "faq6Text": "Stima i tempi di arrivo del tuo ordine negli Stati Uniti, nel Regno Unito, in Canada, in Australia o in qualsiasi altro paese con il nostro algoritmo di stima dei tempi di consegna. Raccogliamo statistiche sui tempi di consegna per ogni pacco che entra in ogni paese e città per fornire la data di arrivo stimata più precisa.",
        "download": "Scarica",
        "downloadApp": "Scarica l'app Parcels per iPhone o Android per sapere sempre dove si trovano i tuoi pacchi e ricevere notifiche push quando il tracciamento dei pacchi cambia.",
        "up": "Su",
        "byTisunov": "di tisunov",
        "footerText": "Parcels offre un'app completa per il tracciamento dei pacchi. Scaricala per iOS o Android.",
        "trademarkDisclaimer": "Tutti i loghi, i nomi dei prodotti e delle società sono marchi™ o marchi registrati® dei rispettivi proprietari. L'uso di essi non implica alcuna affiliazione o approvazione da parte loro. Questo sito e i prodotti e servizi offerti su questo sito non sono associati, affiliati, approvati o sponsorizzati da alcuna azienda elencata in questa pagina e non sono stati esaminati, testati o certificati da altre società elencate in questa pagina.",
        "privacyPolicy": "Politica sulla privacy",
        "trackingButton": "Pulsante di tracciamento",
        "apiDocs": "Documenti API"
    }
};

let currentLanguage = "en";

function changeLanguage(lang) {
    currentLanguage = lang;
    updateContent();
}

function updateContent() {
    const elements = document.querySelectorAll("[data-lang]");
    elements.forEach(element => {
        const key = element.getAttribute("data-lang");
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.innerHTML = translations[currentLanguage][key];
        } else if (translations["en"][key]) {
            element.innerHTML = translations["en"][key]; // Default to English if translation is missing
        }
    });
}

document.addEventListener("DOMContentLoaded", updateContent);