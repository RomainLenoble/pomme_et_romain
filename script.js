// ============================================================
// LISTE DE MARIAGE — configuration
// ============================================================
// 1) Remplacez firebaseConfig ci-dessous par la config de VOTRE
//    projet Firebase (voir SETUP.md pour les étapes détaillées).
// 2) Modifiez la liste GIFTS pour définir vos propres cadeaux.
//    - id      : identifiant unique (sert de nom de document Firestore)
//    - name    : nom affiché
//    - desc    : courte description (optionnel)
//    - target  : objectif en euros (optionnel — laissez null pour
//                une cagnotte libre, sans objectif affiché)
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyDd8TY-a4uP0Wq052sfkGCP7cLVtlS7ugs",
    authDomain: "pomme-romain-mariage.firebaseapp.com",
    projectId: "pomme-romain-mariage",
    storageBucket: "pomme-romain-mariage.firebasestorage.app",
    messagingSenderId: "752822577885",
    appId: "1:752822577885:web:1878bcd7994f23d7464934"
  };

const GIFTS = [
    {
        id: "velo",
        name: "Vélo de route pour Romain",
        desc: "Pour remplacer le vieux vélo qui prend la poussière depuis trois ans.",
        target: 500
    },
    {
        id: "lune-de-miel",
        name: "Cagnotte lune de miel",
        desc: "Un petit coup de pouce pour notre voyage de noces.",
        target: null
    },
    {
        id: "cuisine",
        name: "Ustensiles de cuisine",
        desc: "De quoi équiper la cuisine pour de bon.",
        target: 300
    }
    {
        id: "rdv-dentiste",
        name: "Rdv dentiste pour Romain",
        desc: "De quoi avoir des jolis dents ",
        target: 3000000
    }
     
];

// ============================================================
// Ne rien modifier en dessous de cette ligne
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    doc,
    collection,
    onSnapshot,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const listEl = document.getElementById("gift-list");

function euros(n) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + "\u00A0€";
}

function renderSkeleton() {
    listEl.innerHTML = "";
    GIFTS.forEach((gift) => {
        const card = document.createElement("div");
        card.className = "gift-card";
        card.dataset.giftId = gift.id;

        card.innerHTML = `
            <div class="gift-head">
                <h4>${gift.name}</h4>
                <span class="gift-amounts">
                    <span class="raised" data-role="raised">…</span>${gift.target ? ` / ${euros(gift.target)}` : ""}
                </span>
            </div>
            ${gift.target ? `<div class="progress-track"><div class="progress-fill" data-role="fill" style="width:0%"></div></div>` : ""}
            ${gift.desc ? `<p class="gift-desc">${gift.desc}</p>` : ""}
            <form class="gift-form" data-role="form">
                <div class="gift-form-row">
                    <input type="number" min="1" step="1" inputmode="numeric" placeholder="Montant en €" required>
                    <button type="submit">Participer</button>
                </div>
                <textarea maxlength="280" rows="2" placeholder="Un petit mot pour les mariés (optionnel)"></textarea>
            </form>
            <p class="gift-feedback" data-role="feedback"></p>
        `;

        listEl.appendChild(card);
        wireForm(card, gift);
    });
}

function updateCard(giftId, raised) {
    const card = listEl.querySelector(`[data-gift-id="${giftId}"]`);
    if (!card) return;
    const gift = GIFTS.find((g) => g.id === giftId);

    card.querySelector('[data-role="raised"]').textContent = euros(raised);

    const fill = card.querySelector('[data-role="fill"]');
    if (fill && gift.target) {
        const pct = Math.min(100, Math.round((raised / gift.target) * 100));
        fill.style.width = pct + "%";
    }
}

function wireForm(card, gift) {
    const form = card.querySelector('[data-role="form"]');
    const input = form.querySelector('input[type="number"]');
    const messageEl = form.querySelector("textarea");
    const button = form.querySelector("button");
    const feedback = card.querySelector('[data-role="feedback"]');

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const amount = Math.floor(Number(input.value));
        const message = messageEl.value.trim().slice(0, 280);

        feedback.textContent = "";
        feedback.className = "gift-feedback";

        if (!amount || amount <= 0) {
            feedback.textContent = "Merci d'indiquer un montant valide.";
            feedback.className = "gift-feedback err";
            return;
        }

        button.disabled = true;
        try {
            await contribute(gift.id, amount, message);
            input.value = "";
            messageEl.value = "";
            feedback.textContent = "Merci pour votre participation \u2728";
            feedback.className = "gift-feedback ok";
        } catch (err) {
            console.error(err);
            feedback.textContent = "Oups, la contribution n'a pas pu être enregistrée. Réessayez dans un instant.";
            feedback.className = "gift-feedback err";
        } finally {
            button.disabled = false;
        }
    });
}

let db;

async function contribute(giftId, amount, message) {
    const ref = doc(db, "cadeaux", giftId);
    const entryRef = doc(collection(db, "cadeaux", giftId, "contributions"));
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const current = snap.exists() ? (snap.data().raised || 0) : 0;
        tx.set(ref, { raised: current + amount }, { merge: true });
        tx.set(entryRef, {
            amount,
            message: message || "",
            createdAt: serverTimestamp()
        });
    });
}

function init() {
    renderSkeleton();

    if (firebaseConfig.apiKey === "REMPLACER_MOI") {
        listEl.querySelectorAll('[data-role="raised"]').forEach((el) => (el.textContent = "0\u00A0€"));
        const notice = document.createElement("p");
        notice.className = "gift-status";
        notice.textContent = "Configuration Firebase manquante — voir SETUP.md.";
        listEl.prepend(notice);
        return;
    }

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);

    GIFTS.forEach((gift) => {
        const ref = doc(db, "cadeaux", gift.id);
        onSnapshot(
            ref,
            (snap) => updateCard(gift.id, snap.exists() ? (snap.data().raised || 0) : 0),
            (err) => {
                console.error(err);
                updateCard(gift.id, 0);
            }
        );
    });
}

init();
