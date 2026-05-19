const API = "http://localhost:3000";
let allItems = [];

document.addEventListener("DOMContentLoaded", fetchItems);

// Toggle the add/edit form
function toggleForm() {
  const form = document.getElementById("item-form");
  const btn = document.getElementById("toggle-form-btn");
  const isHidden = form.classList.contains("hidden");
  form.classList.toggle("hidden");
  btn.textContent = isHidden ? "✕ Close" : "+ Add Item";
  if (!isHidden) cancelEdit();
}

// Cancel editing — reset form to "add" mode
function cancelEdit() {
  document.getElementById("item-form").reset();
  document.getElementById("edit-id").value = "";
  document.getElementById("form-title").textContent = "Add New Item";
  document.getElementById("submit-btn").textContent = "Add Item";
  document.getElementById("item-threshold").value = 10;
}

// Fetch all items from the server
async function fetchItems() {
  const res = await fetch(`${API}/items`);
  allItems = await res.json();
  filterItems();
  renderStats(allItems);
}

// Submit form — handles both add and edit
async function submitForm(event) {
  event.preventDefault();

  const id = document.getElementById("edit-id").value;
  const item = {
    name:      document.getElementById("item-name").value,
    sku:       document.getElementById("item-sku").value,
    category:  document.getElementById("item-category").value,
    quantity:  Number(document.getElementById("item-quantity").value),
    price:     parseFloat(document.getElementById("item-price").value),
    threshold: Number(document.getElementById("item-threshold").value),
  };

  if (id) {
    // Edit existing item
    await fetch(`${API}/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  } else {
    // Add new item
    await fetch(`${API}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  }

  cancelEdit();
  document.getElementById("item-form").classList.add("hidden");
  document.getElementById("toggle-form-btn").textContent = "+ Add Item";
  fetchItems();
}

// Populate form with item data for editing
function editItem(id) {
  const item = allItems.find((i) => i.id === id);
  if (!item) return;

  document.getElementById("edit-id").value = item.id;
  document.getElementById("item-name").value = item.name;
  document.getElementById("item-sku").value = item.sku;
  document.getElementById("item-category").value = item.category;
  document.getElementById("item-quantity").value = item.quantity;
  document.getElementById("item-price").value = item.price;
  document.getElementById("item-threshold").value = item.threshold;
  document.getElementById("form-title").textContent = "Edit Item";
  document.getElementById("submit-btn").textContent = "Save Changes";

  const form = document.getElementById("item-form");
  form.classList.remove("hidden");
  document.getElementById("toggle-form-btn").textContent = "✕ Close";
  form.scrollIntoView({ behavior: "smooth" });
}

// Delete an item
async function deleteItem(id) {
  if (!confirm("Are you sure you want to delete this item?")) return;
  await fetch(`${API}/items/${id}`, { method: "DELETE" });
  fetchItems();
}

// Filter items by search and category
function filterItems() {
  const search = document.getElementById("search").value.toLowerCase();
  const category = document.getElementById("filter-category").value;

  const filtered = allItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search) ||
      item.sku.toLowerCase().includes(search);
    const matchesCategory = category === "" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  renderItems(filtered);
}

// Render the items table
function renderItems(items) {
  const tbody = document.getElementById("items-body");
  tbody.innerHTML = "";

  if (items.length === 0) {
    tbody.innerHTML = `<tr id="empty-row"><td colspan="8" class="empty-msg">No items found.</td></tr>`;
    return;
  }

  items.forEach((item) => {
    const value = (item.quantity * item.price).toFixed(2);
    const isLow = item.quantity > 0 && item.quantity <= item.threshold;
    const isOut = item.quantity === 0;

    let statusBadge;
    if (isOut) {
      statusBadge = `<span class="badge out-of-stock">Out of Stock</span>`;
    } else if (isLow) {
      statusBadge = `<span class="badge low-stock">Low Stock</span>`;
    } else {
      statusBadge = `<span class="badge in-stock">In Stock</span>`;
    }

    const row = document.createElement("tr");
    if (isLow || isOut) row.classList.add("low-stock");

    row.innerHTML = `
      <td>${item.name}</td>
      <td><code>${item.sku}</code></td>
      <td>${item.category}</td>
      <td>${item.quantity}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>$${value}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="action-btns">
          <button class="btn-edit" onclick="editItem(${item.id})">Edit</button>
          <button class="btn-delete" onclick="deleteItem(${item.id})">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Update dashboard stat cards
function renderStats(items) {
  const totalItems = items.length;
  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const lowStock = items.filter((i) => i.quantity <= i.threshold && i.quantity > 0).length;
  const categories = new Set(items.map((i) => i.category)).size;

  document.getElementById("total-items").textContent = totalItems;
  document.getElementById("total-value").textContent = `$${totalValue.toFixed(2)}`;
  document.getElementById("low-stock").textContent = lowStock;
  document.getElementById("total-categories").textContent = categories;
}
