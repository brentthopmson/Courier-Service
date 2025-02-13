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
        "faq1Text": "Our platform offers seamless tracking for packages, freight, and shipments. By consolidating data from various postal, courier, and logistics services, we provide you with up-to-date information on your deliveries. To begin tracking, simply enter your tracking number.",
        "faq2Title": "What is a tracking number?",
        "faq2Text": "A tracking number, or tracking code, is a unique identifier assigned to each package. This code allows you to monitor the progress of your parcel as it moves between countries or even within a country. Tracking numbers can be international or traceable only within the sender's country. The tracking number in the format of the Universal Postal Union looks like RA123456789CN, where the first 2 letters indicate the type of package and the last 2 letters are the code of the country of origin. Packages with such numbers can be tracked until delivery. Other shipments may be delivered by courier, transport, and logistics companies, and their tracking codes can vary significantly: CTAFT0000160477YQ, UPAAB000000251682107, AEL10105033654UA, SGADN143797855. These packages are not always trackable in the recipient's country, and you may need to await notification from the Post Office or a call from the courier company.",
        "faq3Title": "How to track a parcel from an online store?",
        "faq3Text": "Tracking your parcel from an online store is straightforward. Once your order has been shipped, the seller will provide a tracking number. This number becomes active within 1-5 days after the order is processed by the delivery service. Use this tracking number on our platform to monitor your parcel's journey. Please note that the order number cannot be used for tracking purposes. However, for ASOS orders, you can use the order number to track your parcel on our service.",
        "faq4Title": "Can't track package for a long time?",
        "faq4Text": "If your package is not trackable immediately after receiving the tracking number, there's no need to worry. It takes time for the postal or courier company to process the parcel, weigh it, prepare customs documents, sort it, and forward it. If tracking information is still unavailable after 7 days, it's possible that the seller has not yet shipped the parcel and has only reserved the tracking number.",
        "faq5Title": "Tracking eBay order",
        "faq5Text": "Tracking your eBay order is simple with our platform. eBay sellers use various delivery and postal companies depending on the item price and shipping method. Whether your order is being handled by SpeedPAK, Pitney Bowes, Global Shipping Program, China Post, Winit, Yanwen, or another carrier, we've got you covered. Refer to our comprehensive guide for tracking eBay orders.",
        "faq6Title": "Delivery time",
        "faq6Text": "Estimate the arrival time of your order to the United States, UK, Canada, Australia, or any other country with our delivery time estimation algorithm. We collect delivery time statistics for each package entering each country and city to provide the most accurate estimated arrival date.",
        "download": "Download",
        "downloadApp": "Download our app for iPhone or Android to stay informed about your packages' locations and receive push notifications when tracking information changes.",
        "up": "Up",
        "byTisunov": "by tisunov",
        "footerText": "Our package tracking app is available for both iOS and Android devices. Download it today for a seamless tracking experience.",
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
        "faq1Text": "Unsere Plattform bietet eine nahtlose Sendungsverfolgung für Pakete, Fracht und Sendungen. Durch die Konsolidierung von Daten verschiedener Post-, Kurier- und Logistikdienste bieten wir Ihnen aktuelle Informationen zu Ihren Lieferungen. Um mit der Verfolgung zu beginnen, geben Sie einfach Ihre Sendungsverfolgungsnummer ein.",
        "faq2Title": "Was ist eine Sendungsverfolgungsnummer?",
        "faq2Text": "Eine Sendungsverfolgungsnummer oder ein Sendungsverfolgungscode ist eine eindeutige Kennung, die jedem Paket zugewiesen wird. Mit diesem Code können Sie den Fortschritt Ihres Pakets verfolgen, während es sich zwischen Ländern oder sogar innerhalb eines Landes bewegt. Sendungsverfolgungsnummern können international sein oder nur innerhalb des Landes des Absenders nachverfolgbar sein. Die Sendungsverfolgungsnummer im Format des Weltpostvereins sieht aus wie RA123456789CN, wobei die ersten 2 Buchstaben die Art des Pakets und die letzten 2 Buchstaben der Code des Ursprungslandes sind. Pakete mit solchen Nummern können bis zur Zustellung verfolgt werden. Andere Sendungen können von Kurier-, Transport- und Logistikunternehmen zugestellt werden, und das Aussehen der Sendungsverfolgungscodes kann sehr unterschiedlich sein: CTAFT0000160477YQ, UPAAB000000251682107, AEL10105033654UA, SGADN143797855. Solche Pakete sind im Empfängerland nicht immer verfolgbar, und Sie müssen auf eine Benachrichtigung von der Post oder einen Anruf von einem Kurierunternehmen warten.",
        "faq3Title": "Wie verfolge ich ein Paket aus einem Online-Shop?",
        "faq3Text": "Die Verfolgung Ihres Pakets aus einem Online-Shop ist unkompliziert. Sobald Ihre Bestellung versandt wurde, stellt der Verkäufer eine Sendungsverfolgungsnummer bereit. Diese Nummer wird innerhalb von 1-5 Tagen nach Bearbeitung der Bestellung durch den Zustelldienst aktiv. Verwenden Sie diese Sendungsverfolgungsnummer auf unserer Plattform, um die Reise Ihres Pakets zu überwachen. Bitte beachten Sie, dass die Bestellnummer nicht zu Verfolgungszwecken verwendet werden kann. Bei ASOS-Bestellungen können Sie jedoch die Bestellnummer verwenden, um Ihr Paket auf unserem Service zu verfolgen.",
        "faq4Title": "Kann das Paket längere Zeit nicht verfolgen?",
        "faq4Text": "Wenn Ihr Paket nach Erhalt der Sendungsverfolgungsnummer nicht sofort verfolgbar ist, besteht kein Grund zur Sorge. Es dauert einige Zeit, bis das Post- oder Kurierunternehmen das Paket bearbeitet, wiegt, Zolldokumente vorbereitet, sortiert und weiterleitet. Wenn nach 7 Tagen immer noch keine Sendungsverfolgungsinformationen verfügbar sind, hat der Verkäufer das Paket möglicherweise noch nicht versandt und nur die Sendungsverfolgungsnummer reserviert.",
        "faq5Title": "eBay-Bestellung verfolgen",
        "faq5Text": "Die Verfolgung Ihrer eBay-Bestellung ist mit unserer Plattform ganz einfach. eBay-Verkäufer verwenden je nach Artikelpreis und Versandart verschiedene Zustell- und Postunternehmen. Unabhängig davon, ob Ihre Bestellung von SpeedPAK, Pitney Bowes, Global Shipping Program, China Post, Winit, Yanwen oder einem anderen Spediteur bearbeitet wird, wir sind für Sie da. In unserem umfassenden Leitfaden zur Verfolgung von eBay-Bestellungen finden Sie weitere Informationen.",
        "faq6Title": "Lieferzeit",
        "faq6Text": "Schätzen Sie die Ankunftszeit Ihrer Bestellung in den Vereinigten Staaten, Großbritannien, Kanada, Australien oder einem anderen Land mit unserem Algorithmus zur Schätzung der Lieferzeit. Wir sammeln Lieferzeitstatistiken für jedes Paket, das in jedes Land und jede Stadt eingeht, um das genaueste geschätzte Ankunftsdatum zu liefern.",
        "download": "Herunterladen",
        "downloadApp": "Laden Sie unsere App für iPhone oder Android herunter, um über den Standort Ihrer Pakete auf dem Laufenden zu bleiben und Push-Benachrichtigungen zu erhalten, wenn sich die Sendungsverfolgungsinformationen ändern.",
        "up": "Nach oben",
        "byTisunov": "von tisunov",
        "footerText": "Unsere App zur Paketverfolgung ist sowohl für iOS- als auch für Android-Geräte verfügbar. Laden Sie sie noch heute herunter, um ein nahtloses Tracking-Erlebnis zu erhalten.",
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
        "faq1Text": "Notre plateforme offre un suivi transparent des colis, du fret et des envois. En consolidant les données de divers services postaux, de messagerie et de logistique, nous vous fournissons des informations à jour sur vos livraisons. Pour commencer le suivi, entrez simplement votre numéro de suivi.",
        "faq2Title": "Qu'est-ce qu'un numéro de suivi ?",
        "faq2Text": "Un numéro de suivi, ou code de suivi, est un identifiant unique attribué à chaque colis. Ce code vous permet de suivre la progression de votre colis lors de son déplacement entre les pays ou même au sein d'un pays. Les numéros de suivi peuvent être internationaux ou traçables uniquement dans le pays de l'expéditeur. Le numéro de suivi au format de l'Union postale universelle ressemble à RA123456789CN, où les 2 premières lettres indiquent le type de colis et les 2 dernières lettres sont le code du pays d'origine. Les colis avec de tels numéros peuvent être suivis jusqu'à la livraison. D'autres envois peuvent être livrés par des entreprises de messagerie, de transport et de logistique, et l'apparence des codes de suivi peut varier considérablement : CTAFT0000160477YQ, UPAAB000000251682107, AEL10105033654UA, SGADN143797855. Ces colis ne sont pas toujours traçables dans le pays du destinataire, et vous devrez peut-être attendre une notification du bureau de poste ou un appel d'une entreprise de messagerie.",
        "faq3Title": "Comment suivre un colis depuis une boutique en ligne ?",
        "faq3Text": "Le suivi de votre colis depuis une boutique en ligne est simple. Une fois votre commande expédiée, le vendeur vous fournira un numéro de suivi. Ce numéro devient actif dans un délai de 1 à 5 jours après le traitement de la commande par le service de livraison. Utilisez ce numéro de suivi sur notre plateforme pour suivre le parcours de votre colis. Veuillez noter que le numéro de commande ne peut pas être utilisé à des fins de suivi. Toutefois, pour les commandes ASOS, vous pouvez utiliser le numéro de commande pour suivre votre colis sur notre service.",
        "faq4Title": "Impossible de suivre le colis pendant longtemps ?",
        "faq4Text": "Si votre colis n'est pas traçable immédiatement après avoir reçu le numéro de suivi, il n'y a pas lieu de s'inquiéter. Il faut du temps à l'entreprise postale ou de messagerie pour traiter le colis, le peser, préparer les documents douaniers, le trier et le faire suivre. Si les informations de suivi ne sont toujours pas disponibles après 7 jours, il est possible que le vendeur n'ait pas encore expédié le colis et n'ait réservé que le numéro de suivi.",
        "faq5Title": "Suivre une commande eBay",
        "faq5Text": "Le suivi de votre commande eBay est simple grâce à notre plateforme. Les vendeurs eBay utilisent diverses entreprises de livraison et postales en fonction du prix de l'article et du mode d'expédition. Que votre commande soit traitée par SpeedPAK, Pitney Bowes, Global Shipping Program, China Post, Winit, Yanwen ou un autre transporteur, nous sommes là pour vous aider. Consultez notre guide complet pour suivre les commandes eBay.",
        "faq6Title": "Délai de livraison",
        "faq6Text": "Estimez le délai d'arrivée de votre commande aux États-Unis, au Royaume-Uni, au Canada, en Australie ou dans tout autre pays grâce à notre algorithme d'estimation du délai de livraison. Nous recueillons des statistiques sur les délais de livraison pour chaque colis entrant dans chaque pays et chaque ville afin de fournir la date d'arrivée estimée la plus précise.",
        "download": "Télécharger",
        "downloadApp": "Téléchargez notre application pour iPhone ou Android pour rester informé de l'emplacement de vos colis et recevoir des notifications push lorsque les informations de suivi changent.",
        "up": "Haut",
        "byTisunov": "par tisunov",
        "footerText": "Notre application de suivi de colis est disponible pour les appareils iOS et Android. Téléchargez-la dès aujourd'hui pour une expérience de suivi transparente.",
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
        "faq1Text": "La nostra piattaforma offre un tracciamento continuo per pacchi, merci e spedizioni. Consolidando i dati di vari servizi postali, di corriere e logistici, ti forniamo informazioni aggiornate sulle tue consegne. Per iniziare il tracciamento, inserisci semplicemente il tuo numero di tracciamento.",
        "faq2Title": "Cos'è un numero di tracciamento?",
        "faq2Text": "Un numero di tracciamento, o codice di tracciamento, è un identificatore univoco assegnato a ciascun pacco. Questo codice ti consente di monitorare l'avanzamento del tuo pacco mentre si sposta tra i paesi o anche all'interno di un paese. I numeri di tracciamento possono essere internazionali o tracciabili solo all'interno del paese del mittente. Il numero di tracciamento nel formato dell'Unione postale universale assomiglia a RA123456789CN, dove le prime 2 lettere indicano il tipo di pacco e le ultime 2 lettere sono il codice del paese di origine. I pacchi con tali numeri possono essere tracciati fino alla consegna. Altre spedizioni possono essere consegnate da corrieri, società di trasporto e logistica e l'aspetto dei codici di tracciamento può variare notevolmente: CTAFT0000160477YQ, UPAAB000000251682107, AEL10105033654UA, SGADN143797855. Tali pacchi non sono sempre tracciabili nel paese del destinatario e dovrai attendere una notifica dall'ufficio postale o una chiamata da una società di corriere.",
        "faq3Title": "Come tracciare un pacco da un negozio online?",
        "faq3Text": "Tracciare il tuo pacco da un negozio online è semplice. Una volta spedito l'ordine, il venditore ti fornirà un numero di tracciamento. Questo numero diventa attivo entro 1-5 giorni dopo che l'ordine è stato elaborato dal servizio di consegna. Utilizza questo numero di tracciamento sulla nostra piattaforma per monitorare il percorso del tuo pacco. Tieni presente che il numero dell'ordine non può essere utilizzato per scopi di tracciamento. Tuttavia, per gli ordini ASOS, puoi utilizzare il numero dell'ordine per tracciare il tuo pacco sul nostro servizio.",
        "faq4Title": "Impossibile tracciare il pacco per molto tempo?",
        "faq4Text": "Se il tuo pacco non è tracciabile subito dopo aver ricevuto il numero di tracciamento, non c'è motivo di preoccuparsi. Ci vuole tempo perché la società postale o di corriere elabori il pacco, lo pesi, prepari i documenti doganali, lo smisti e lo inoltri. Se le informazioni di tracciamento non sono ancora disponibili dopo 7 giorni, è possibile che il venditore non abbia ancora spedito il pacco e abbia solo riservato il numero di tracciamento.",
        "faq5Title": "Traccia l'ordine eBay",
        "faq5Text": "Tracciare il tuo ordine eBay è semplice con la nostra piattaforma. I venditori eBay utilizzano varie società di consegna e postali a seconda del prezzo dell'articolo e del metodo di spedizione. Che il tuo ordine venga gestito da SpeedPAK, Pitney Bowes, Global Shipping Program, China Post, Winit, Yanwen o un altro corriere, ci pensiamo noi. Consulta la nostra guida completa per tracciare gli ordini eBay.",
        "faq6Title": "Tempo di consegna",
        "faq6Text": "Stima i tempi di arrivo del tuo ordine negli Stati Uniti, nel Regno Unito, in Canada, in Australia o in qualsiasi altro paese con il nostro algoritmo di stima dei tempi di consegna. Raccogliamo statistiche sui tempi di consegna per ogni pacco che entra in ogni paese e città per fornire la data di arrivo stimata più precisa.",
        "download": "Scarica",
        "downloadApp": "Scarica la nostra app per iPhone o Android per rimanere informato sulla posizione dei tuoi pacchi e ricevere notifiche push quando le informazioni di tracciamento cambiano.",
        "up": "Su",
        "byTisunov": "di tisunov",
        "footerText": "La nostra app per il tracciamento dei pacchi è disponibile sia per dispositivi iOS che Android. Scaricala oggi stesso per un'esperienza di tracciamento senza interruzioni.",
        "trademarkDisclaimer": "Tutti i loghi, i nomi dei prodotti e delle società sono marchi™ o marchi registrati® dei rispettivi proprietari. L'uso di essi non implica alcuna affiliazione o approvazione da parte loro. Questo sito e i prodotti e servizi offerti su questo sito non sono associati, affiliati, approvati o sponsorizzati da alcuna azienda elencata in questa pagina e non sono stati esaminati, testati o certificati da altre società elencate in questa pagina.",
        "privacyPolicy": "Politica sulla privacy",
        "trackingButton": "Pulsante di tracciamento",
        "apiDocs": "Documenti API"
    },
    "es": {
        "pageTitle": "Rastreo de Paquetes Universal - Rastreo Global de Paquetes",
        "title": "Rastreo Global de Paquetes",
        "description": "Ofrecemos soporte de rastreo para la mayoría de los transportistas principales. Ingrese su número de rastreo para comenzar.",
        "track": "Rastrear paquete",
        "switchNav": "Cambiar navegación",
        "brand": "Paquetes",
        "language": "Español",
        "english": "Inglés",
        "german": "Alemán",
        "french": "Francés",
        "italian": "Italiano",
        "spanish": "Español",
        "portuguese": "Portugués",
        "swedish": "Sueco",
        "dutch": "Holandés",
        "korean": "Coreano",
        "indonesian": "Indonesio",
        "russian": "Ruso",
        "chooseCountry": "Elegir país",
        "faq1Title": "Rastrea cualquier paquete, carga y envío",
        "faq1Text": "Nuestra plataforma ofrece un rastreo continuo para paquetes, carga y envíos. Al consolidar los datos de varios servicios postales, de mensajería y logística, le proporcionamos información actualizada sobre sus entregas. Para comenzar el rastreo, simplemente ingrese su número de rastreo.",
        "faq2Title": "¿Qué es un número de rastreo?",
        "faq2Text": "Un número de rastreo, o código de rastreo, es un identificador único asignado a cada paquete. Este código le permite monitorear el progreso de su paquete a medida que se mueve entre países o incluso dentro de un país. Los números de rastreo pueden ser internacionales o rastreables solo dentro del país del remitente. El número de rastreo en el formato de la Unión Postal Universal se parece a RA123456789CN, donde las primeras 2 letras indican el tipo de paquete y las últimas 2 letras son el código del país de origen. Los paquetes con tales números pueden ser rastreados hasta la entrega. Otros envíos pueden ser entregados por empresas de mensajería, transporte y logística, y la apariencia de los códigos de rastreo puede variar considerablemente: CTAFT0000160477YQ, UPAAB000000251682107, AEL10105033654UA, SGADN143797855. Tales paquetes no siempre son rastreables en el país del destinatario, y es posible que deba esperar una notificación de la oficina de correos o una llamada de una empresa de mensajería.",
        "faq3Title": "¿Cómo rastrear un paquete de una tienda en línea?",
        "faq3Text": "Rastrear su paquete de una tienda en línea es sencillo. Una vez que su pedido ha sido enviado, el vendedor le proporcionará un número de rastreo. Este número se activa entre 1 y 5 días después de que el servicio de entrega haya procesado el pedido. Utilice este número de rastreo en nuestra plataforma para monitorear el recorrido de su paquete. Tenga en cuenta que el número de pedido no se puede utilizar para fines de rastreo. Sin embargo, para los pedidos de ASOS, puede utilizar el número de pedido para rastrear su paquete en nuestro servicio.",
        "faq4Title": "¿No puede rastrear el paquete durante mucho tiempo?",
        "faq4Text": "Si su paquete no se puede rastrear inmediatamente después de recibir el número de rastreo, no hay necesidad de preocuparse. La empresa postal o de mensajería tarda en procesar el paquete, pesarlo, preparar los documentos de aduana, clasificarlo y reenviarlo. Si la información de rastreo aún no está disponible después de 7 días, es posible que el vendedor aún no haya enviado el paquete y solo haya reservado el número de rastreo.",
        "faq5Title": "Rastrear pedido de eBay",
        "faq5Text": "Rastrear su pedido de eBay es fácil con nuestra plataforma. Los vendedores de eBay utilizan varias empresas de entrega y postales según el precio del artículo y el método de envío. Ya sea que su pedido sea gestionado por SpeedPAK, Pitney Bowes, Global Shipping Program, China Post, Winit, Yanwen u otro transportista, lo tenemos cubierto. Consulte nuestra guía completa para rastrear pedidos de eBay.",
        "faq6Title": "Tiempo de entrega",
        "faq6Text": "Estime el tiempo de llegada de su pedido a los Estados Unidos, Reino Unido, Canadá, Australia o cualquier otro país con nuestro algoritmo de estimación del tiempo de entrega. Recopilamos estadísticas de tiempo de entrega para cada paquete que ingresa a cada país y ciudad para proporcionar la fecha de llegada estimada más precisa.",
        "download": "Descargar",
        "downloadApp": "Descargue nuestra aplicación para iPhone o Android para mantenerse informado sobre la ubicación de sus paquetes y recibir notificaciones push cuando cambie la información de rastreo.",
        "up": "Arriba",
        "byTisunov": "por tisunov",
        "footerText": "Nuestra aplicación de rastreo de paquetes está disponible tanto para dispositivos iOS como Android. Descárguela hoy mismo para una experiencia de rastreo sin problemas.",
        "trademarkDisclaimer": "Todos los logotipos, nombres de productos y empresas son marcas comerciales™ o marcas registradas® de sus respectivos propietarios. El uso de los mismos no implica ninguna afiliación o respaldo por parte de los mismos. Este sitio y los productos y servicios ofrecidos en este sitio no están asociados, afiliados, respaldados o patrocinados por ninguna empresa que figure en esta página ni han sido revisados, probados o certificados por ninguna otra empresa que figure en esta página.",
        "privacyPolicy": "Política de privacidad",
        "trackingButton": "Botón de rastreo",
        "apiDocs": "Documentos de la API"
    },
   "pt": {
        "pageTitle": "Rastreamento Universal de Encomendas - Rastreamento Global de Encomendas",
        "title": "Rastreamento Global de Encomendas",
        "description": "Oferecemos suporte de rastreamento para a maioria das transportadoras principais. Insira seu número de rastreamento para começar.",
        "track": "Rastrear encomenda",
        "switchNav": "Alternar navegação",
        "brand": "Encomendas",
        "language": "Português",
        "english": "Inglês",
        "german": "Alemão",
        "french": "Francês",
        "italian": "Italiano",
        "spanish": "Espanhol",
        "portuguese": "Português",
        "swedish": "Sueco",
        "dutch": "Holandês",
        "korean": "Coreano",
        "indonesian": "Indonésio",
        "russian": "Russo",
        "chooseCountry": "Escolher país",
        "faq1Title": "Rastreie qualquer pacote, frete e remessa",
        "faq1Text": "Nossa plataforma oferece rastreamento contínuo para pacotes, frete e remessas. Ao consolidar os dados de vários serviços postais, de courier e logística, fornecemos informações atualizadas sobre suas entregas. Para iniciar o rastreamento, basta inserir seu número de rastreamento.",
        "faq2Title": "O que é um número de rastreamento?",
        "faq2Text": "Um número de rastreamento, ou código de rastreamento, é um identificador exclusivo atribuído a cada pacote. Este código permite que você monitore o progresso do seu pacote à medida que ele se move entre países ou mesmo dentro de um país. Os números de rastreamento podem ser internacionais ou rastreáveis apenas dentro do país do remetente. O número de rastreamento no formato da União Postal Universal se parece com RA123456789CN, onde as primeiras 2 letras indicam o tipo de pacote e as últimas 2 letras são o código do país de origem. Pacotes com esses números podem ser rastreados até a entrega. Outras remessas podem ser entregues por empresas de courier, transporte e logística, e a aparência dos códigos de rastreamento pode variar consideravelmente: CTAFT0000160477YQ, UPAAB000000251682107, AEL10105033654UA, SGADN143797855. Tais pacotes nem sempre são rastreáveis no país do destinatário, e você pode precisar aguardar uma notificação do correio ou uma ligação de uma empresa de courier.",
        "faq3Title": "Como rastrear um pacote de uma loja online?",
        "faq3Text": "Rastrear seu pacote de uma loja online é simples. Depois que seu pedido for enviado, o vendedor fornecerá um número de rastreamento. Este número se torna ativo entre 1 e 5 dias após o pedido ser processado pelo serviço de entrega. Use este número de rastreamento em nossa plataforma para monitorar o percurso do seu pacote. Observe que o número do pedido não pode ser usado para fins de rastreamento. No entanto, para pedidos da ASOS, você pode usar o número do pedido para rastrear seu pacote em nosso serviço.",
        "faq4Title": "Não consegue rastrear o pacote por muito tempo?",
        "faq4Text": "Se o seu pacote não for rastreável imediatamente após receber o número de rastreamento, não há necessidade de se preocupar. Leva tempo para a empresa postal ou de courier processar o pacote, pesá-lo, preparar os documentos alfandegários, classificá-lo e encaminhá-lo. Se as informações de rastreamento ainda não estiverem disponíveis após 7 dias, é possível que o vendedor ainda não tenha enviado o pacote e tenha apenas reservado o número de rastreamento.",
        "faq5Title": "Rastrear pedido da eBay",
        "faq5Text": "Rastrear seu pedido da eBay é fácil com nossa plataforma. Os vendedores da eBay usam várias empresas de entrega e postais, dependendo do preço do item e do método de envio. Se o seu pedido for gerenciado pela SpeedPAK, Pitney Bowes, Global Shipping Program, China Post, Winit, Yanwen ou outra transportadora, nós o cobrimos. Consulte nosso guia completo para rastrear pedidos da eBay.",
        "faq6Title": "Tempo de entrega",
        "faq6Text": "Estime o tempo de chegada do seu pedido aos Estados Unidos, Reino Unido, Canadá, Austrália ou qualquer outro país com nosso algoritmo de estimativa de tempo de entrega. Coletamos estatísticas de tempo de entrega para cada pacote que entra em cada país e cidade para fornecer a data de chegada estimada mais precisa.",
        "download": "Baixar",
        "downloadApp": "Baixe nosso aplicativo para iPhone ou Android para se manter informado sobre a localização de seus pacotes e receber notificações push quando as informações de rastreamento mudarem.",
        "up": "Para cima",
        "byTisunov": "por tisunov",
        "footerText": "Nosso aplicativo de rastreamento de pacotes está disponível para dispositivos iOS e Android. Baixe-o hoje mesmo para uma experiência de rastreamento perfeita.",
        "trademarkDisclaimer": "Todos os logotipos, nomes de produtos e empresas são marcas comerciais™ ou marcas registradas® de seus respectivos proprietários. O uso deles não implica qualquer afiliação ou endosso por eles. Este site e os produtos e serviços oferecidos neste site não são associados, afiliados, endossados ou patrocinados por nenhuma empresa listada nesta página e não foram revisados, testados ou certificados por nenhuma outra empresa listada nesta página.",
        "privacyPolicy": "Política de privacidade",
        "trackingButton": "Botão de rastreamento",
        "apiDocs": "Documentos da API"
    },
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