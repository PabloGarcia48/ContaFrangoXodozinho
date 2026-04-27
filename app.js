const STORAGE_KEY = "conta-frango-produtos";
const channel = "BroadcastChannel" in window ? new BroadcastChannel(STORAGE_KEY) : null;

function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  notifyProducts(products);
}

function notifyProducts(products) {
  document.dispatchEvent(new CustomEvent("products:changed", { detail: products }));

  if (channel) {
    channel.postMessage(products);
  }
}

function subscribeToProducts(callback) {
  const emit = () => callback(loadProducts());

  document.addEventListener("products:changed", (event) => {
    callback(event.detail);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      emit();
    }
  });

  if (channel) {
    channel.addEventListener("message", (event) => {
      callback(Array.isArray(event.data) ? event.data : loadProducts());
    });
  }
}

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function createProduct(name) {
  return {
    id: crypto.randomUUID(),
    name,
    quantity: 1,
  };
}

function updateProducts(updater) {
  const nextProducts = updater(loadProducts());
  saveProducts(nextProducts);
}

function setupControlPage() {
  const form = document.querySelector("#product-form");
  const input = document.querySelector("#product-name");
  const list = document.querySelector("#product-list");
  const clearButton = document.querySelector("#clear-all");

  if (!form || !input || !list || !clearButton) {
    return;
  }

  function render(products) {
    if (products.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          Nenhum produto cadastrado ainda. Adicione o primeiro item acima.
        </div>
      `;
      return;
    }

    list.innerHTML = products
      .map(
        (product) => `
          <article class="product-item">
            <div class="product-info">
              <div class="product-name">${escapeHtml(product.name)}</div>
              <div class="product-meta">Clique nos botoes para ajustar a quantidade</div>
            </div>

            <div class="quantity-controls" aria-label="Controles de quantidade para ${escapeHtml(product.name)}">
              <button class="icon-button" type="button" data-action="decrease" data-id="${product.id}" aria-label="Diminuir quantidade">
                -
              </button>
              <span class="quantity-value">${product.quantity}</span>
              <button class="icon-button" type="button" data-action="increase" data-id="${product.id}" aria-label="Aumentar quantidade">
                +
              </button>
            </div>

            <button class="delete-button" type="button" data-action="remove" data-id="${product.id}" aria-label="Excluir produto">
              x
            </button>
          </article>
        `,
      )
      .join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const normalizedName = normalizeName(input.value);
    if (!normalizedName) {
      input.focus();
      return;
    }

    updateProducts((products) => {
      const existing = products.find(
        (product) => product.name.toLowerCase() === normalizedName.toLowerCase(),
      );

      if (existing) {
        return products.map((product) =>
          product.id === existing.id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        );
      }

      return [...products, createProduct(normalizedName)];
    });

    input.value = "";
    input.focus();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const { action, id } = button.dataset;
    if (!action || !id) {
      return;
    }

    updateProducts((products) => {
      if (action === "remove") {
        return products.filter((product) => product.id !== id);
      }

      return products.map((product) => {
        if (product.id !== id) {
          return product;
        }

        if (action === "increase") {
          return { ...product, quantity: product.quantity + 1 };
        }

        return {
          ...product,
          quantity: Math.max(0, product.quantity - 1),
        };
      });
    });
  });

  clearButton.addEventListener("click", () => {
    saveProducts([]);
  });

  subscribeToProducts(render);
  render(loadProducts());
}

function setupViewerPage() {
  const list = document.querySelector("#viewer-list");
  const total = document.querySelector("#total-items");

  if (!list || !total) {
    return;
  }

  function render(products) {
    const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
    total.textContent = `${totalQuantity} ${totalQuantity === 1 ? "item" : "itens"}`;

    if (products.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          A lista esta vazia no momento. Quando produtos forem adicionados, eles aparecem aqui automaticamente.
        </div>
      `;
      return;
    }

    list.innerHTML = products
      .map(
        (product) => `
          <article class="viewer-item">
            <div class="viewer-info">
              <div class="viewer-name">${escapeHtml(product.name)}</div>
              <div class="viewer-meta">Quantidade atual</div>
            </div>
            <div class="viewer-badge">${product.quantity}</div>
          </article>
        `,
      )
      .join("");
  }

  subscribeToProducts(render);
  render(loadProducts());
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

setupControlPage();
setupViewerPage();
