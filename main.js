// 1. Duomenų saugojimas LocalStorage.
const KEY = "cartList";
const CART_KEY = "shoppingCart";

function loadData(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

let products = loadData(KEY);
let cart = loadData(CART_KEY);
let editingId = null;

const $ = id => document.getElementById(id);

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch {
        message("formMsg", "Nepavyko išsaugoti duomenų!", false);
        return false;
    }
}

function message(elementId, text, success) {
    const el = $(elementId);
    el.textContent = text;
    el.className = "message " + (success ? "ok" : "err");
}

function hideMessage(elementId) {
    $(elementId).textContent = "";
    $(elementId).className = "message";
}

// Saugus lentelių užpildymas.
function cell(text) {
    const td = document.createElement("td");
    td.textContent = String(text);
    return td;
}

function button(text, color, action) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    b.className = color;
    b.addEventListener("click", action);
    return b;
}

// 2. Visų prekių atvaizdavimas.
function renderProducts() {
    const tbody = $("productsTable");
    tbody.replaceChildren();

    if (!products.length) {
        const tr = document.createElement("tr");
        const td = cell("Prekių nėra");
        td.colSpan = 4;
        td.className = "empty";
        tr.append(td);
        tbody.append(tr);
    }

    products.forEach(p => {
        const tr = document.createElement("tr");
        tr.append(cell(p.id), cell(p.name), cell(p.quantity));

        const actions = document.createElement("td");
        actions.append(
            button("Redaguoti", "orange", () => editProduct(p.id)),
            button("Ištrinti", "red", () => deleteProduct(p.id))
        );
        tr.append(actions);
        tbody.append(tr);
    });

    $("productCount").textContent = "Prekių skaičius: " + products.length;
}

// 3. Krepšelio atvaizdavimas.
function renderCart() {
    const tbody = $("cartTable");
    tbody.replaceChildren();

    if (!cart.length) {
        const tr = document.createElement("tr");
        const td = cell("Krepšelis tuščias");
        td.colSpan = 4;
        td.className = "empty";
        tr.append(td);
        tbody.append(tr);
    }

    cart.forEach(p => {
        const tr = document.createElement("tr");
        tr.append(cell(p.id), cell(p.name), cell(p.quantity));

        const actions = document.createElement("td");
        actions.append(button("Pašalinti", "red", () => removeCartItem(p.id)));
        tr.append(actions);
        tbody.append(tr);
    });
}

function renderAll() {
    renderProducts();
    renderCart();
}

// 4. Formos laukų išvalymas.
function resetForm() {
    $("productForm").reset();
    editingId = null;
    $("id").readOnly = false;
    $("formTitle").textContent = "Prekės duomenys";
    $("saveBtn").textContent = "Įvesti naują";
    $("cancelBtn").hidden = true;
}

// 5. Naujos prekės įvedimas ir redagavimas.
$("productForm").addEventListener("submit", event => {
    event.preventDefault();
    hideMessage("formMsg");

    const id = $("id").value.trim();
    const name = $("name").value.trim();
    const quantityText = $("quantity").value.trim();
    const quantity = Number(quantityText);

    if (!id || !name || !quantityText) {
        return message("formMsg", "Užpildyk visus laukus!", false);
    }

    if (!/^\d+$/.test(id)) {
        return message("formMsg", "ID turi sudaryti tik skaitmenys!", false);
    }

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
        return message("formMsg", "Kiekis turi būti teigiamas sveikasis skaičius!", false);
    }

    if (editingId === null) {
        if (products.some(p => p.id === id)) {
            return message("formMsg", "Toks prekės ID jau egzistuoja!", false);
        }

        const updated = [...products, { id, name, quantity }];
        if (!saveData(KEY, updated)) return;
        products = updated;

        message("formMsg", "Prekė sėkmingai įvesta!", true);
    } else {
        const updated = products.map(p =>
            p.id === editingId ? { id: editingId, name, quantity } : p
        );

        const updatedCart = cart.map(p =>
            p.id === editingId ? { ...p, name } : p
        );

        if (!saveData(KEY, updated)) return;
        if (!saveData(CART_KEY, updatedCart)) {
            saveData(KEY, products);
            return;
        }

        products = updated;
        cart = updatedCart;
        message("formMsg", "Prekės duomenys atnaujinti!", true);
    }

    resetForm();
    renderAll();
    refreshSearch();
});

// 6. Redagavimas pagal ID, automatiškai užpildant formą.
function editProduct(id) {
    const p = products.find(item => item.id === id);
    if (!p) return message("formMsg", "Prekė nerasta!", false);

    editingId = id;
    $("id").value = p.id;
    $("id").readOnly = true;
    $("name").value = p.name;
    $("quantity").value = p.quantity;
    $("formTitle").textContent = "Redaguojama prekė: " + id;
    $("saveBtn").textContent = "Išsaugoti pakeitimus";
    $("cancelBtn").hidden = false;
    hideMessage("formMsg");
}

// 7. Redagavimo atšaukimas ir formos išvalymas.
$("cancelBtn").addEventListener("click", () => {
    resetForm();
    hideMessage("formMsg");
});

$("clearFormBtn").addEventListener("click", () => {
    resetForm();
    hideMessage("formMsg");
});

// 8. Prekės trynimas iš LocalStorage ir abiejų lentelių.
function deleteProduct(id) {
    const p = products.find(item => item.id === id);
    if (!p) return message("formMsg", "Prekė nerasta!", false);

    if (!confirm("Ar tikrai ištrinti prekę " + p.name + "?")) return;

    const updatedProducts = products.filter(item => item.id !== id);
    const updatedCart = cart.filter(item => item.id !== id);

    if (!saveData(KEY, updatedProducts)) return;
    if (!saveData(CART_KEY, updatedCart)) {
        saveData(KEY, products);
        return;
    }

    products = updatedProducts;
    cart = updatedCart;

    if (editingId === id) resetForm();

    renderAll();
    refreshSearch();
    message("formMsg", "Prekė ištrinta iš sandėlio ir krepšelio!", true);
}

// 9. Konkrečios prekės paieška pagal ID.
function searchProduct(id) {
    const tbody = $("searchTable");
    tbody.replaceChildren();

    const p = products.find(item => item.id === id);

    if (!p) {
        const tr = document.createElement("tr");
        const td = cell("Prekė nerasta");
        td.colSpan = 4;
        td.className = "empty";
        tr.append(td);
        tbody.append(tr);
        return message("searchMsg", "Prekė pagal šį ID nerasta!", false);
    }

    const tr = document.createElement("tr");
    tr.append(cell(p.id), cell(p.name), cell(p.quantity));

    const actions = document.createElement("td");
    actions.append(button("Į krepšelį", "green", () => addToCart(p.id)));
    tr.append(actions);
    tbody.append(tr);

    message("searchMsg", "Prekė rasta!", true);
}

$("searchForm").addEventListener("submit", event => {
    event.preventDefault();
    const id = $("searchId").value.trim();

    if (!/^\d+$/.test(id)) {
        return message("searchMsg", "Įvesk skaitinį prekės ID!", false);
    }

    searchProduct(id);
});

function refreshSearch() {
    const id = $("searchId").value.trim();
    if (id && /^\d+$/.test(id)) searchProduct(id);
}

$("clearSearch").addEventListener("click", () => {
    $("searchId").value = "";
    $("searchTable").replaceChildren();

    const tr = document.createElement("tr");
    const td = cell("Paieškos rezultatų nėra");
    td.colSpan = 4;
    td.className = "empty";
    tr.append(td);
    $("searchTable").append(tr);
    hideMessage("searchMsg");
});

// 10. Prekės įdėjimas į krepšelį.
function addToCart(id) {
    const p = products.find(item => item.id === id);
    if (!p) return message("cartMsg", "Prekė nerasta!", false);

    const existing = cart.find(item => item.id === id);
    const updated = existing
        ? cart.map(item => item.id === id
            ? { ...item, quantity: item.quantity + p.quantity }
            : item)
        : [...cart, { ...p }];

    if (!saveData(CART_KEY, updated)) return;

    cart = updated;
    renderCart();
    message("cartMsg", "Prekė įdėta į krepšelį!", true);
}

// 11. Prekės pašalinimas iš krepšelio.
function removeCartItem(id) {
    const updated = cart.filter(item => item.id !== id);
    if (!saveData(CART_KEY, updated)) return;

    cart = updated;
    renderCart();
    message("cartMsg", "Prekė pašalinta iš krepšelio!", true);
}

$("clearCart").addEventListener("click", () => {
    if (!cart.length) {
        return message("cartMsg", "Krepšelis jau tuščias!", false);
    }

    if (!confirm("Ar tikrai išvalyti krepšelį?")) return;
    if (!saveData(CART_KEY, [])) return;

    cart = [];
    renderCart();
    message("cartMsg", "Krepšelis išvalytas!", true);
});

// 12. Pradinis duomenų atvaizdavimas.
renderAll();