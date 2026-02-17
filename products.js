const API_BASE = 'https://fakestoreapi.com';

let allProducts = [];
let currentCategory = 'all';
let cart = [];

const categoryContainer = document.getElementById('categoryContainer');
const productsGrid = document.getElementById('productsGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const productModal = document.getElementById('productModal');
const modalContent = document.getElementById('modalContent');

// ==================== Active Link Detection ====================
function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href').split('/').pop() || 'index.html';
    
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Add scroll effect for navbar
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('nav');
  if (window.scrollY > 10) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ==================== Cart Functions ====================
// Initialize cart from localStorage
function initCart() {
  const savedCart = localStorage.getItem('swiftcart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
  updateCartBadge();
}

// Update cart badge count
function updateCartBadge() {
  const cartBadge = document.getElementById('cartBadge');
  if (cartBadge) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;
  }
}

// Add item to cart and update badge
function saveCart() {
  localStorage.setItem('swiftcart', JSON.stringify(cart));
  updateCartBadge();
}

// ==================== End Cart Functions ====================

document.addEventListener('DOMContentLoaded', () => {
  setActiveNavLink();
  initCart();
  loadCategories();
  loadProducts();
});

async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE}/products/categories`);
    const categories = await response.json();

    categories.forEach(category => {
      const button = createCategoryButton(category);
      categoryContainer.appendChild(button);
    });

    setupCategoryListeners();
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

function createCategoryButton(category) {
  const button = document.createElement('button');
  button.className = 'category-btn px-6 py-2 rounded-full bg-gray-200 text-gray-700 font-medium';
  button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
  button.setAttribute('data-category', category);
  return button;
}

function setupCategoryListeners() {
  const categoryButtons = document.querySelectorAll('.category-btn');

  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const category = button.getAttribute('data-category');
      currentCategory = category;
      loadProducts(category);
    });
  });
}

async function loadProducts(category = 'all') {
  showLoading(true);

  try {
    const url = category === 'all'
      ? `${API_BASE}/products`
      : `${API_BASE}/products/category/${category}`;

    const response = await fetch(url);
    const products = await response.json();

    allProducts = products;
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    productsGrid.innerHTML = `
      <div class="col-span-full text-center py-20">
        <p class="text-red-500 text-lg">Failed to load products. Please try again later.</p>
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

function displayProducts(products) {
  productsGrid.innerHTML = '';

  if (products.length === 0) {
    productsGrid.innerHTML = `
      <div class="col-span-full text-center py-20">
        <p class="text-gray-500 text-lg">No products found in this category.</p>
      </div>
    `;
    return;
  }

  products.forEach(product => {
    const card = createProductCard(product);
    productsGrid.appendChild(card);
  });
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card bg-white rounded-lg overflow-hidden';

  const truncatedTitle = truncateText(product.title, 50);
  const stars = generateStars(product.rating.rate);

  card.innerHTML = `
    <div class="relative">
      <img src="${product.image}" alt="${product.title}" class="product-image">
    </div>
    
    <div class="p-4">
      <span class="badge-category">${product.category}</span>
      
      <h3 class="text-lg font-semibold text-gray-900 mt-3 mb-2 truncate-2-lines" title="${product.title}">
        ${truncatedTitle}
      </h3>
      
      <div class="flex items-center gap-2 mb-3">
        <div class="star-rating flex text-sm">
          ${stars}
        </div>
        <span class="text-sm text-gray-600">(${product.rating.count})</span>
      </div>
      
      <div class="flex items-center justify-between mb-4">
        <span class="text-2xl font-bold text-indigo-600">$${product.price}</span>
      </div>
      
      <div class="flex gap-2">
        <button onclick="openProductModal(${product.id})" 
          class="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition font-medium text-sm">
          <i class="fas fa-info-circle mr-1"></i> Details
        </button>
        <button onclick="addToCart(${product.id})" 
          class="flex-1 px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700 transition font-medium text-sm">
          <i class="fas fa-cart-plus mr-1"></i> Add
        </button>
      </div>
    </div>
  `;

  return card;
}

// generate random star

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let stars = '';

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }

  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }

  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>';
  }

  return stars;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}


// modal functionality

async function openProductModal(productId) {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`);
    const product = await response.json();

    displayProductModal(product);
    productModal.showModal();
  } catch (error) {
    console.error('Error loading product details:', error);
  }
}

function displayProductModal(product) {
  const stars = generateStars(product.rating.rate);

  modalContent.innerHTML = `
    <div class="md:w-2/5 flex-shrink-0">
      <img src="${product.image}" alt="${product.title}" class="w-full h-80 object-contain bg-gray-50 rounded-lg p-4">
    </div>
    
    <div class="md:w-3/5">
      <span class="badge-category">${product.category}</span>
      
      <h2 class="text-2xl font-bold text-gray-900 mt-3 mb-3">${product.title}</h2>
      
      <div class="flex items-center gap-2 mb-4">
        <div class="star-rating flex">
          ${stars}
        </div>
        <span class="text-sm text-gray-600">${product.rating.rate} (${product.rating.count} reviews)</span>
      </div>
      
      <div class="mb-4">
        <span class="text-3xl font-bold text-indigo-600">$${product.price}</span>
      </div>
      
      <div class="mb-6">
        <h3 class="font-semibold text-gray-900 mb-2">Description</h3>
        <p class="text-gray-600 leading-relaxed">${product.description}</p>
      </div>
      
      <div class="flex gap-3">
        <button onclick="addToCart(${product.id})" 
          class="flex-1 px-6 py-3 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition font-medium">
          <i class="fas fa-cart-plus mr-2"></i> Add to Cart
        </button>
        <button onclick="buyNow(${product.id})" 
          class="flex-1 px-6 py-3 bg-green-600 rounded-lg text-white hover:bg-green-700 transition font-medium">
          <i class="fas fa-shopping-bag mr-2"></i> Buy Now
        </button>
      </div>
    </div>
  `;
}

function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);

  if (product) {
    console.log('Added to cart:', product);

    // Add to cart array
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }
    
    // Save and update badge
    saveCart();

    // Close modal if open
    if (productModal.open) {
      productModal.close();
    }

    // Show success message
    showNotification('Product added to cart!', 'success');
  }
}

function buyNow(productId) {
  const product = allProducts.find(p => p.id === productId);

  if (product) {
    console.log('Buying now:', product);

    if (productModal.open) {
      productModal.close();
    }

    showNotification('Redirecting to checkout...', 'info');
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `fixed top-20 right-4 px-6 py-3 rounded-lg text-white z-50 shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    }`;
  notification.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} mr-2"></i>
    ${message}
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

function showLoading(show) {
  if (show) {
    loadingSpinner.style.display = 'flex';
    productsGrid.style.display = 'none';
  } else {
    loadingSpinner.style.display = 'none';
    productsGrid.style.display = 'grid';
  }
}

const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

menuToggle.addEventListener('click', function () {
  mobileMenu.classList.toggle('active');
});