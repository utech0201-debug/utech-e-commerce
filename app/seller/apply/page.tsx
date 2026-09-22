"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48); }

export default function SellerApplyPage() {
  const router = useRouter();
  const [storeName,setStoreName]=useState(""); const [storeSlug,setStoreSlug]=useState(""); const [description,setDescription]=useState(""); const [email,setEmail]=useState("");
  const [loading,setLoading]=useState(true); const [submitting,setSubmitting]=useState(false); const [error,setError]=useState(""); const [notice,setNotice]=useState("");

  useEffect(()=>{ async function loadUser(){ const {data}=await supabase.auth.getUser(); if(!data.user){router.replace("/auth/login?next=/seller/apply");return;} setEmail(data.user.email??""); const {data:seller}=await supabase.from("sellers").select("store_name,store_slug,description,status").eq("user_id",data.user.id).maybeSingle(); if(seller){setStoreName(seller.store_name);setStoreSlug(seller.store_slug);setDescription(seller.description??"");setNotice(seller.status==="approved"?"Your seller account is approved. You can open your dashboard.":`Your application is currently ${seller.status}.`);} setLoading(false);} void loadUser();},[router]);

  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");setNotice("");const trimmedName=storeName.trim();const slug=slugify(storeSlug||trimmedName);if(!trimmedName||!slug){setError("Enter a valid store name.");return;}setSubmitting(true);const {data:userData}=await supabase.auth.getUser();if(!userData.user){router.replace("/auth/login?next=/seller/apply");return;}const {error:insertError}=await supabase.from("sellers").insert({user_id:userData.user.id,store_name:trimmedName,store_slug:slug,description:description.trim()||null});if(insertError){setError(insertError.code==="23505"?"That store name or store URL is already in use.":insertError.message);setSubmitting(false);return;}setNotice("Application submitted. UTECH will review your seller account.");setSubmitting(false);router.refresh();}

  if(loading)return <section className="section auth-section"><div className="container auth-container"><div className="auth-card"><p>Loading seller application...</p></div></div></section>;

  return <section className="section auth-section"><div className="container auth-container"><div className="auth-card"><span className="eyebrow">SELL ON UTECH</span><h1>Open your seller store.</h1><p>Submit your store details. New seller accounts start in review before products can be published.</p><form className="auth-form" onSubmit={submit}>
    <label>Store name<input value={storeName} onChange={e=>{setStoreName(e.target.value);if(!storeSlug)setStoreSlug(slugify(e.target.value));}} placeholder="Example Tech Hub" required disabled={Boolean(notice)}/></label>
    <label>Store URL<input value={storeSlug} onChange={e=>setStoreSlug(slugify(e.target.value))} placeholder="example-tech-hub" required disabled={Boolean(notice)}/></label>
    <label>Seller email<input value={email} readOnly/></label>
    <label>Store description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tell customers what your store sells." rows={5} disabled={Boolean(notice)}/></label>
    {error&&<p className="auth-error">{error}</p>}{notice&&<p className="auth-success">{notice}</p>}
    {!notice&&<button className="button button-primary" type="submit" disabled={submitting}>{submitting?"Submitting...":"Submit Seller Application"}</button>}
  </form><p className="auth-switch"><Link href="/seller/dashboard">Open seller dashboard →</Link></p></div></div></section>;
}
