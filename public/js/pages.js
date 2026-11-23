/* Page behaviour. Each page sets <body data-page="..."> and the matching function below runs. */
(function () {
  const NB = window.NB;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (s) => NB.esc(s);
  const params = new URLSearchParams(location.search);

  /** Replace <span data-icon="name"> placeholders with the icon. */
  const fillIcons = (root = document) =>
    $$("[data-icon]", root).forEach((el) => {
      const fn = NB.icon[el.dataset.icon];
      if (fn) el.innerHTML = fn();
      el.removeAttribute("data-icon");
    });

  const weightOptions = (selected) =>
    NB.WEIGHTS.map((w) => `<option value="${w.id}"${w.id === selected ? " selected" : ""}>${w.label}</option>`).join("");

  /* ------------------------------------------------------------ home */
  function home() {
    const grid = $("[data-collections]");
    grid.innerHTML = NB.COLLECTIONS.map(
      (c) => `<article class="collection-card tone-${c.tone}" data-reveal>
        <div class="folder-tab"></div><span class="folder-label">Explore collection</span>
        <h3><a class="stretched" href="products.html?c=${c.id}">${esc(c.name)}</a></h3>
        <img src="${c.img}" alt="" width="200" height="160" loading="lazy" />
        <div class="collection-card-foot">
          <span>${esc(c.line)}</span>
          <span class="round-arrow" aria-hidden="true">${NB.icon.arrow(18)}</span>
        </div>
      </article>`
    ).join("");
    const choices = $("#gift-treats");
    if (choices) {
      const items = NB.PRODUCTS.filter((p) => ["laddus", "chikkies", "ariselu"].includes(p.collection));
      const selected = []; const size = $("#gift-size"); const preview = $("#gift-box-view");
      const render = () => { const cap=Number(size.value); preview.style.setProperty("--slots",cap); preview.innerHTML=Array.from({length:cap},(_,i)=>selected[i]?`<div class="gift-slot"><img src="${esc(selected[i].img)}" alt="${esc(selected[i].name)}"></div>`:`<div class="gift-slot empty">+</div>`).join(""); $("#gift-count").textContent=`${selected.length} of ${cap} treats added`; $("#gift-preview-title").textContent=`Your ${size.selectedOptions[0].text.toLowerCase()} box`; $("#gift-customize").href=NB.waLink(`Hello NutBytes! Please customize a ${size.selectedOptions[0].text} gift box. Treats: ${selected.map(p=>p.name).join(", ")||"please suggest a mix"}.`); };
      choices.innerHTML=items.map(p=>`<button type="button" data-gift="${esc(p.id)}"><img src="${esc(p.img)}" alt=""><span>${esc(p.name)}</span><b>+</b></button>`).join("");
      choices.addEventListener("click",e=>{const id=e.target.closest("[data-gift]")?.dataset.gift;if(!id)return;const cap=Number(size.value);if(selected.length>=cap)selected.shift();selected.push(NB.productById(id));render();});size.addEventListener("change",()=>{selected.length=Math.min(selected.length,Number(size.value));render();});render();
    }
  }

  /* ------------------------------------------------------------ shop */
  function snacks() {
    const chips = $("[data-chips]");
    const grid = $("[data-grid]");
    const note = $("[data-note]");
    const q = $("#shop-q");
    const sort = $("#shop-sort");
    let active = NB.collectionById(params.get("c")) ? params.get("c") : "all";
    q.value = params.get("q") || "";

    chips.innerHTML = [{ id: "all", name: "All snacks" }, ...NB.COLLECTIONS]
      .map((c) => `<button class="chip" type="button" data-c="${c.id}">${esc(c.name)}</button>`)
      .join("");

    function render() {
      $$(".chip", chips).forEach((b) => {
        const on = b.dataset.c === active;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on);
      });
      let list = q.value.trim() ? NB.search(q.value) : NB.PRODUCTS.slice();
      if (active !== "all") list = list.filter((p) => p.collection === active);
      if (sort.value === "low") list.sort((a, b) => a.price - b.price);
      if (sort.value === "high") list.sort((a, b) => b.price - a.price);
      if (sort.value === "name") list.sort((a, b) => a.name.localeCompare(b.name));

      const where = active === "all" ? "" : ` in ${NB.collectionById(active).name}`;
      note.textContent = q.value.trim()
        ? `${list.length} result${list.length === 1 ? "" : "s"} for “${q.value.trim()}”${where}`
        : `${list.length} snack${list.length === 1 ? "" : "s"}${where}`;

      grid.innerHTML = list.length
        ? list.map(NB.productCard).join("")
        : `<div class="empty-state" style="grid-column:1/-1"><h2>No snacks found</h2>
            <p>Try another word, or browse all our snacks.</p>
            <button class="btn btn-brown" type="button" data-reset>Show all snacks</button></div>`;
      NB.reveal();

      // keep the URL shareable
      const u = new URL(location.href);
      q.value.trim() ? u.searchParams.set("q", q.value.trim()) : u.searchParams.delete("q");
      active !== "all" ? u.searchParams.set("c", active) : u.searchParams.delete("c");
      history.replaceState(null, "", u);
    }

    chips.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      active = b.dataset.c;
      render();
    });
    grid.addEventListener("click", (e) => {
      if (!e.target.closest("[data-reset]")) return;
      q.value = "";
      active = "all";
      render();
    });
    q.addEventListener("input", render);
    sort.addEventListener("change", render);
    $("#shop-form").addEventListener("submit", (e) => e.preventDefault());
    render();
  }

  /* ------------------------------------------------------------ product */
  function product() {
    const p = NB.productById(params.get("id") || "");
    const root = $("[data-product]");
    if (!p) {
      root.innerHTML = `<div class="empty-state"><h2>Snack not found</h2>
        <p>This snack may have moved. Have a look at everything we make.</p>
        <a class="btn btn-brown" href="products.html">Browse snacks</a></div>`;
      return;
    }
    const c = NB.collectionById(p.collection);
    document.title = `${p.name} – NutBytes`;
    $("[data-crumb]").innerHTML = `<a href="index.html">Home</a> / <a href="products.html?c=${c.id}">${esc(c.name)}</a> / ${esc(p.name)}`;

    root.innerHTML = `<div class="pdp">
      <div class="pdp-media tone-${c.tone}"><img src="${p.img}" alt="${esc(p.name)}" width="800" height="800" /></div>
      <div class="pdp-info">
        <a class="eyebrow" href="products.html?c=${c.id}">${esc(c.name)}</a>
        <h1>${esc(p.name)}</h1>
        <p class="pdp-price"><span data-price></span> <small data-per></small></p>
        <p class="pdp-desc">${esc(p.short)}</p>
        <form data-buy>
          <span class="option-label" id="w-label">Choose a pack</span>
          <div class="weights" role="radiogroup" aria-labelledby="w-label">
            ${NB.WEIGHTS.map(
              (w, i) => `<label><input type="radio" name="weight" value="${w.id}"${i === 0 ? " checked" : ""} /><span>${w.label}</span></label>`
            ).join("")}
          </div>
          <span class="option-label" id="q-label">Quantity</span>
          <div class="buy-row">
            <div class="stepper" aria-labelledby="q-label">
              <button type="button" data-step="-1" aria-label="Decrease quantity">${NB.icon.minus()}</button>
              <output data-qty aria-live="polite">1</output>
              <button type="button" data-step="1" aria-label="Increase quantity">${NB.icon.plus()}</button>
            </div>
            <button class="btn btn-brown" type="submit">Add to Cart ${NB.icon.cart(18)}</button>
            <button class="btn btn-outline" type="button" data-buy-now>Buy Now</button>
          </div>
        </form>
        <a class="btn btn-wa" style="margin-top:14px" data-wa-product href="#" target="_blank" rel="noopener noreferrer">${NB.icon.whatsapp(20)} Order this on WhatsApp</a>
        <ul class="trust-list">
          <li>${NB.icon.check()} No processed sugar</li>
          <li>${NB.icon.check()} No maida</li>
          <li>${NB.icon.check()} FSSAI registered</li>
          <li>${NB.icon.check()} Delivering in Ongole and nearby areas</li>
        </ul>
      </div>
    </div>`;

    let qty = 1;
    const form = $("[data-buy]");
    const weight = () => form.weight.value;
    const update = () => {
      $("[data-qty]").textContent = qty;
      $("[data-price]").textContent = NB.money(NB.priceFor(p, weight()) * qty);
      $("[data-per]").textContent = `for ${qty} × ${NB.weightById(weight()).label}`;
      $("[data-wa-product]").href = NB.waLink(
        `Hello NutBytes! I would like to order:\n• Product: ${p.name}, Weight: ${NB.weightById(weight()).label}, Quantity: ${qty}`
      );
    };
    form.addEventListener("change", update);
    form.addEventListener("click", (e) => {
      const b = e.target.closest("[data-step]");
      if (!b) return;
      qty = Math.min(NB.MAX_QTY, Math.max(1, qty + Number(b.dataset.step)));
      update();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      NB.cart.add(p.id, weight(), qty);
      NB.toast(`${qty} × ${p.name} (${NB.weightById(weight()).label}) added to your cart`);
    });
    $("[data-buy-now]").addEventListener("click", () => {
      NB.cart.add(p.id, weight(), qty);
      location.href = "cart.html";
    });
    update();

    const related = NB.PRODUCTS.filter((x) => x.collection === p.collection && x.id !== p.id)
      .concat(NB.PRODUCTS.filter((x) => x.collection !== p.collection))
      .slice(0, 3);
    $("[data-related]").innerHTML = related.map(NB.productCard).join("");
  }

  /* ------------------------------------------------------------ cart */
  function cart() {
    const root = $("[data-cart]");
    function render() {
      const { lines, subtotal } = NB.cart.lines();
      if (!lines.length) {
        root.innerHTML = `<div class="empty-state"><h2>Your cart is empty</h2>
          <p>Add something wholesome from our snacks.</p>
          <a class="btn btn-brown" href="products.html">Explore Our Snacks ${NB.icon.arrow()}</a></div>`;
        return;
      }
      const count = lines.reduce((n, l) => n + l.qty, 0);
      root.innerHTML = `<div class="cart-layout">
        <ul class="cart-list">
          ${lines
            .map(
              (l) => `<li class="cart-item" data-id="${l.id}" data-weight="${l.weight}">
            <a href="product.html?id=${l.id}"><img src="${l.product.img}" alt="" width="92" height="92" loading="lazy" /></a>
            <div>
              <h3><a href="product.html?id=${l.id}">${esc(l.product.name)}</a></h3>
              <p class="cart-item-meta">${NB.money(l.unit)} each</p>
              <div class="cart-item-ctl">
                <select data-weight-select aria-label="Pack size for ${esc(l.product.name)}">${weightOptions(l.weight)}</select>
                <div class="stepper sm" role="group" aria-label="Quantity of ${esc(l.product.name)}">
                  <button type="button" data-step="-1" aria-label="Decrease quantity">${NB.icon.minus(14)}</button>
                  <output aria-live="polite">${l.qty}</output>
                  <button type="button" data-step="1" aria-label="Increase quantity"${l.qty >= NB.MAX_QTY ? " disabled" : ""}>${NB.icon.plus(14)}</button>
                </div>
              </div>
            </div>
            <div class="cart-item-right">
              <span class="price">${NB.money(l.total)}</span>
              <button class="link-btn" type="button" data-remove>${NB.icon.trash(16)} Remove</button>
            </div>
          </li>`
            )
            .join("")}
        </ul>
        <aside class="summary" aria-label="Order summary">
          <h2>Order Summary</h2>
          <div class="summary-row"><span>Items (${count})</span><span>${NB.money(subtotal)}</span></div>
          <div class="summary-row"><span>Delivery</span><span>Confirmed on WhatsApp</span></div>
          <div class="summary-row total"><span>Total</span><span>${NB.money(subtotal)}</span></div>
          <a class="btn btn-brown btn-block" href="checkout.html">Proceed to Checkout ${NB.icon.arrow()}</a>
          <a class="btn btn-outline btn-block" href="products.html">Continue Shopping</a>
          <p class="note">Delivery charges, if any, are confirmed with you on WhatsApp before we pack your order.</p>
        </aside>
      </div>`;
    }

    root.addEventListener("click", (e) => {
      const item = e.target.closest(".cart-item");
      if (!item) return;
      const { id, weight } = item.dataset;
      const line = NB.cart.items().find((i) => i.id === id && i.weight === weight);
      if (!line) return;
      const step = e.target.closest("[data-step]");
      if (step) NB.cart.setQty(id, weight, line.qty + Number(step.dataset.step));
      if (e.target.closest("[data-remove]")) {
        NB.cart.remove(id, weight);
        NB.toast(`${NB.productById(id).name} removed from your cart`);
      }
    });
    root.addEventListener("change", (e) => {
      const sel = e.target.closest("[data-weight-select]");
      if (!sel) return;
      const { id, weight } = sel.closest(".cart-item").dataset;
      NB.cart.setWeight(id, weight, sel.value);
    });
    document.addEventListener("nb:cart", render);
    render();
  }

  /* ------------------------------------------------------------ checkout */
  function checkout() {
    const root = $("[data-checkout]");
    const { lines, subtotal } = NB.cart.lines();
    if (!lines.length) {
      root.innerHTML = `<div class="empty-state"><h2>Your cart is empty</h2>
        <p>Add a few snacks before checking out.</p>
        <a class="btn btn-brown" href="products.html">Explore Our Snacks</a></div>`;
      return;
    }
    const user = NB.auth.user() || {};
    const today = new Date().toISOString().slice(0, 10);
    root.innerHTML = `<div class="cart-layout">
      <form class="checkout-form" novalidate>
        <section class="card">
          <h2>Your details</h2>
          ${user.name ? "" : `<p class="small-note" style="text-align:left;margin:-8px 0 16px">Have an account? <a href="login.html?next=checkout.html" style="color:var(--rose-ink);font-weight:500">Log in</a> to fill this in faster.</p>`}
          <div class="form-grid">
            ${field("name", "Full name", "text", user.name, 'autocomplete="name" required')}
            ${field("phone", "Phone number", "tel", user.phone, 'autocomplete="tel" inputmode="tel" required')}
            ${field("email", 'Email <em>(optional)</em>', "email", user.email, 'autocomplete="email"', "full")}
          </div>
        </section>
        <section class="card">
          <h2>Delivery address</h2>
          <div class="form-grid">
            ${field("address", "House no., street and area", "text", "", 'autocomplete="street-address" required', "full")}
            ${field("city", "Town / city", "text", "Ongole", 'autocomplete="address-level2" required')}
            ${field("pincode", "Pincode", "text", "", 'autocomplete="postal-code" inputmode="numeric" maxlength="6" required')}
            ${field("date", 'Delivery date <em>(optional)</em>', "date", "", `min="${today}"`)}
            <label class="field full"><span>Note for us <em>(optional)</em></span><textarea name="note" rows="2"></textarea></label>
          </div>
        </section>
        <section class="card">
          <h2>Payment</h2>
          <div class="pay-options">
            <label><input type="radio" name="payment" value="Cash on delivery" checked />
              <span><b>Cash on delivery</b><small>Pay when your snacks arrive.</small></span></label>
            <label><input type="radio" name="payment" value="UPI on confirmation" />
              <span><b>UPI</b><small>We'll share UPI details on WhatsApp when we confirm your order.</small></span></label>
          </div>
        </section>
        <div class="form-error" data-error hidden></div>
      </form>
      <aside class="summary" aria-label="Order summary">
        <h2>Your Order</h2>
        <ul class="summary-items">
          ${lines
            .map(
              (l) => `<li><img src="${l.product.img}" alt="" width="48" height="48" />
              <span>${esc(l.product.name)}<small>${NB.weightById(l.weight).label} × ${l.qty}</small></span>
              <span>${NB.money(l.total)}</span></li>`
            )
            .join("")}
        </ul>
        <div class="summary-row"><span>Subtotal</span><span>${NB.money(subtotal)}</span></div>
        <div class="summary-row"><span>Delivery</span><span>Confirmed on WhatsApp</span></div>
        <div class="summary-row total"><span>Total</span><span>${NB.money(subtotal)}</span></div>
        <button class="btn btn-brown btn-block" type="button" data-place>Place Order ${NB.icon.arrow()}</button>
        <p class="note">After placing your order, send it to us on WhatsApp so we can confirm it.</p>
      </aside>
    </div>`;

    const form = $(".checkout-form");
    const rules = {
      name: (v) => v.trim().length >= 2 || "Please enter your name.",
      phone: (v) => /^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "").replace(/^(\+?91)/, "")) || "Enter a 10-digit mobile number.",
      email: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Enter a valid email or leave it empty.",
      address: (v) => v.trim().length >= 5 || "Please enter your delivery address.",
      city: (v) => v.trim().length >= 2 || "Please enter your town or city.",
      pincode: (v) => /^\d{6}$/.test(v.trim()) || "Enter a 6-digit pincode.",
    };
    const check = (name) => {
      const input = form.elements[name];
      const res = rules[name](input.value);
      const wrap = input.closest(".field");
      wrap.classList.toggle("has-error", res !== true);
      let msg = wrap.querySelector(".error");
      if (res !== true) {
        if (!msg) wrap.insertAdjacentHTML("beforeend", `<span class="error" id="${name}-err"></span>`);
        wrap.querySelector(".error").textContent = res;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", `${name}-err`);
      } else {
        msg && msg.remove();
        input.removeAttribute("aria-invalid");
      }
      return res === true;
    };
    Object.keys(rules).forEach((n) => form.elements[n].addEventListener("blur", () => check(n)));

    $("[data-place]").addEventListener("click", () => {
      const ok = Object.keys(rules).map(check).every(Boolean);
      const err = $("[data-error]");
      if (!ok) {
        err.hidden = false;
        err.textContent = "Please fix the highlighted fields.";
        form.querySelector("[aria-invalid]")?.focus();
        return;
      }
      err.hidden = true;
      const v = (n) => form.elements[n].value.trim();
      const order = NB.orders.place({
        name: v("name"),
        phone: v("phone"),
        email: v("email"),
        address: v("address"),
        city: v("city"),
        pincode: v("pincode"),
        date: v("date"),
        note: v("note"),
        payment: form.elements.payment.value,
      });
      location.href = `order-confirmation.html?id=${encodeURIComponent(order.id)}`;
    });
  }

  function field(name, label, type, value = "", attrs = "", cls = "") {
    return `<label class="field ${cls}"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value || "")}" ${attrs} /></label>`;
  }

  /* ------------------------------------------------------------ confirmation */
  function confirmation() {
    const root = $("[data-confirm]");
    const order = NB.orders.byId(params.get("id") || "");
    if (!order) {
      root.innerHTML = `<div class="empty-state"><h2>We couldn't find that order</h2>
        <p>Orders are saved on the device they were placed on. Check your order ID, or contact us on WhatsApp.</p>
        <a class="btn btn-brown" href="help.html#track">Track an order</a></div>`;
      return;
    }
    const d = order.details;
    root.innerHTML = `<div class="confirm">
      <div class="confirm-icon">${NB.icon.check(40)}</div>
      <h1>Thank you, ${esc(d.name.split(" ")[0])}!</h1>
      <p class="lead">Your order is saved. Send it to us on WhatsApp and we'll confirm the price, delivery and payment with you.</p>
      <span class="order-id">Order ID: ${esc(order.id)}</span>
      <div class="confirm-actions">
        <a class="btn btn-wa" href="${NB.waLink(NB.orderMessage(order))}" target="_blank" rel="noopener noreferrer">${NB.icon.whatsapp(20)} Send Order on WhatsApp</a>
        <a class="btn btn-outline" href="products.html">Continue Shopping</a>
      </div>
      <section class="card">
        <h2>Order summary</h2>
        <ul class="summary-items">
          ${order.items
            .map((i) => {
              const p = NB.productById(i.id);
              return `<li><img src="${p ? p.img : ""}" alt="" width="48" height="48" />
                <span>${esc(i.name)}<small>${NB.weightById(i.weight).label} × ${i.qty}</small></span><span>${NB.money(i.total)}</span></li>`;
            })
            .join("")}
        </ul>
        <div class="summary-row total"><span>Total</span><span>${NB.money(order.subtotal)}</span></div>
        <div class="summary-row"><span>Deliver to</span><span style="text-align:right">${esc(d.address)}, ${esc(d.city)} – ${esc(d.pincode)}</span></div>
        ${d.date ? `<div class="summary-row"><span>Delivery date</span><span>${d.date.split("-").reverse().join("/")}</span></div>` : ""}
        <div class="summary-row"><span>Payment</span><span>${esc(d.payment)}</span></div>
      </section>
      <section class="card">
        <h2>What happens next</h2>
        <ol class="next-steps">
          <li>Tap “Send Order on WhatsApp”. Your order is already typed in, so just check it and press send.</li>
          <li>We confirm the price, delivery charge (if any) and delivery time on WhatsApp.</li>
          <li>We pack your snacks fresh and deliver them to your door.</li>
        </ol>
      </section>
    </div>`;
  }

  /* ------------------------------------------------------------ account */
  function account() {
    const root = $("[data-account]");
    const next = params.get("next");
    const safeNext = next && /^[a-z-]+\.html$/.test(next) ? next : null;

    function render() {
      const user = NB.auth.user();
      if (user) {
        const mine = NB.orders.all().filter((o) => o.details.phone === user.phone || o.details.email === user.email);
        root.innerHTML = `<div class="auth-wrap">
          <section class="card">
            <h2>Hello, ${esc(user.name.split(" ")[0])}</h2>
            <p>${esc(user.email)}${user.phone ? " · " + esc(user.phone) : ""}</p>
            <div class="confirm-actions" style="justify-content:flex-start">
              <a class="btn btn-brown btn-sm" href="products.html">Shop snacks</a>
              <button class="btn btn-outline btn-sm" type="button" data-logout>Log out</button>
            </div>
          </section>
          <section class="card">
            <h2>Your orders</h2>
            ${
              mine.length
                ? `<ul class="orders-list">${mine
                    .map(
                      (o) => `<li class="order-row"><a href="order-confirmation.html?id=${o.id}"><b>${o.id}</b></a>
                      <span>${new Date(o.placedAt).toLocaleDateString("en-IN")}</span><span>${NB.money(o.subtotal)}</span></li>`
                    )
                    .join("")}</ul>`
                : `<p class="small-note" style="text-align:left">No orders yet.</p>`
            }
          </section>
        </div>`;
        $("[data-logout]").addEventListener("click", () => {
          NB.auth.logout();
          NB.toast("You've been logged out");
          render();
        });
        return;
      }
      root.innerHTML = `<div class="auth-wrap">
        <div class="tabs" role="tablist">
          <button type="button" role="tab" id="tab-login" aria-controls="pane-login" aria-selected="true">Log In</button>
          <button type="button" role="tab" id="tab-register" aria-controls="pane-register" aria-selected="false">Register</button>
        </div>
        <section class="card" id="pane-login" role="tabpanel" aria-labelledby="tab-login">
          <form class="auth-form" data-form="login" novalidate>
            ${field("email", "Email", "email", "", 'autocomplete="email" required')}
            ${field("password", "Password", "password", "", 'autocomplete="current-password" required')}
            <div class="form-error" data-error hidden></div>
            <button class="btn btn-brown btn-block" type="submit">Log In</button>
          </form>
        </section>
        <section class="card" id="pane-register" role="tabpanel" aria-labelledby="tab-register" hidden>
          <form class="auth-form" data-form="register" novalidate>
            ${field("name", "Full name", "text", "", 'autocomplete="name" required')}
            ${field("email", "Email", "email", "", 'autocomplete="email" required')}
            ${field("phone", "Phone number", "tel", "", 'autocomplete="tel" inputmode="tel"')}
            ${field("password", "Password <em>(at least 8 characters)</em>", "password", "", 'autocomplete="new-password" minlength="8" required')}
            <div class="form-error" data-error hidden></div>
            <button class="btn btn-brown btn-block" type="submit">Create Account</button>
          </form>
        </section>
        <p class="small-note" style="margin-top:16px">Your account is saved in this browser only, so it won't follow you to another device.</p>
      </div>`;

      const tabs = $$("[role=tab]", root);
      const show = (id) => {
        tabs.forEach((t) => {
          const on = t.id === id;
          t.setAttribute("aria-selected", on);
          $("#" + t.getAttribute("aria-controls")).hidden = !on;
        });
      };
      tabs.forEach((t) => t.addEventListener("click", () => show(t.id)));
      if (params.get("tab") === "register") show("tab-register");

      $$("[data-form]", root).forEach((form) =>
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const err = $("[data-error]", form);
          const data = Object.fromEntries(new FormData(form));
          const problem =
            (form.dataset.form === "register" && (data.name || "").trim().length < 2 && "Please enter your name.") ||
            (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((data.email || "").trim()) && "Please enter a valid email.") ||
            (form.dataset.form === "register" && data.password.length < 8 && "Use a password of at least 8 characters.") ||
            (!data.password && "Please enter your password.");
          if (problem) {
            err.hidden = false;
            err.textContent = problem;
            return;
          }
          try {
            await NB.auth[form.dataset.form](data);
            NB.toast(form.dataset.form === "register" ? "Welcome to NutBytes!" : "Welcome back!");
            if (safeNext) location.href = safeNext;
            else render();
          } catch (ex) {
            err.hidden = false;
            err.textContent = ex.message;
          }
        })
      );
    }
    render();
  }

  /* ------------------------------------------------------------ help: track order */
  function help() {
    const form = $("[data-track]");
    const out = $("[data-track-result]");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = form.elements.id.value.trim();
      const o = id && NB.orders.byId(id);
      out.innerHTML = o
        ? `<div class="order-row"><b>${esc(o.id)}</b><span>${esc(o.status)}</span><span>${NB.money(o.subtotal)}</span>
            <a class="btn btn-sm btn-outline" href="order-confirmation.html?id=${encodeURIComponent(o.id)}">View order</a></div>`
        : `<p class="form-error">We couldn't find “${esc(id)}” on this device. Orders are saved on the device they were placed on.
            Message us on WhatsApp with your order ID and we'll check for you.</p>`;
    });
  }

  const PAGES = { home, snacks, product, cart, checkout, confirmation, account, help };

  document.addEventListener("nb:ready", () => {
    fillIcons();
    const fn = PAGES[document.body.dataset.page];
    fn && fn();
    fillIcons();
    // a little bump on the cart badge whenever the cart changes
    document.addEventListener("nb:cart", () =>
      $$("[data-cart-count]").forEach((el) => {
        el.classList.add("bump");
        setTimeout(() => el.classList.remove("bump"), 250);
      })
    );
  });
})();
