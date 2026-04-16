--
-- PostgreSQL database dump
--

\restrict 2TaXtjZdEWVfqf1DzpdVvI0OHZKZXWFQGUaidIczJ7pJdosxrAgwVJpRwN7gh3V

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_table_access_method = heap;

--
-- Name: ai_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_modules (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    active boolean NOT NULL,
    credit_cost_per_call integer NOT NULL,
    description character varying(255),
    name character varying(255) NOT NULL,
    default_provider character varying(20) DEFAULT 'OPENAI'::character varying NOT NULL,
    CONSTRAINT ai_modules_default_provider_check CHECK (((default_provider)::text = ANY ((ARRAY['OPENAI'::character varying, 'GEMINI'::character varying, 'CLAUDE'::character varying, 'STABILITY_AI'::character varying])::text[])))
);


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size_bytes bigint NOT NULL,
    file_type character varying(255) NOT NULL,
    storage_key text NOT NULL,
    job_id uuid NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: credit_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_wallets (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    balance integer NOT NULL,
    lifetime_earned integer NOT NULL,
    lifetime_used integer NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    completed_at timestamp(6) without time zone,
    credit_used integer NOT NULL,
    error_message text,
    input_payload text,
    output_payload text,
    started_at timestamp(6) without time zone,
    status character varying(255) NOT NULL,
    module_id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider character varying(20) DEFAULT 'OPENAI'::character varying NOT NULL,
    CONSTRAINT jobs_provider_check CHECK (((provider)::text = ANY ((ARRAY['OPENAI'::character varying, 'GEMINI'::character varying, 'CLAUDE'::character varying, 'STABILITY_AI'::character varying])::text[]))),
    CONSTRAINT jobs_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'RUNNING'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying])::text[])))
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    monthly_credits integer NOT NULL,
    name character varying(255) NOT NULL,
    plan_type character varying(255) NOT NULL,
    price_per_month numeric(10,2) NOT NULL,
    CONSTRAINT plans_plan_type_check CHECK (((plan_type)::text = ANY ((ARRAY['FREE'::character varying, 'PRO'::character varying, 'ENTERPRISE'::character varying])::text[])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    plan_id uuid,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'USER'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'SUSPENDED'::character varying])::text[])))
);


--
-- Name: ai_modules ai_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_modules
    ADD CONSTRAINT ai_modules_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: credit_wallets credit_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_wallets
    ADD CONSTRAINT credit_wallets_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: plans uk2gyieabqo0thpw94ujkq7taea; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT uk2gyieabqo0thpw94ujkq7taea UNIQUE (plan_type);


--
-- Name: users uk6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: ai_modules ukeap4grab9vwxd8lojf73x97hb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_modules
    ADD CONSTRAINT ukeap4grab9vwxd8lojf73x97hb UNIQUE (name);


--
-- Name: credit_wallets ukywugbn6gv3cjy32me0wqokhp; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_wallets
    ADD CONSTRAINT ukywugbn6gv3cjy32me0wqokhp UNIQUE (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: jobs fk1k0bjjwjhvp4nugr27li977si; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT fk1k0bjjwjhvp4nugr27li977si FOREIGN KEY (module_id) REFERENCES public.ai_modules(id);


--
-- Name: credit_wallets fk3w94yauokhmok5a3cmx0yco2f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_wallets
    ADD CONSTRAINT fk3w94yauokhmok5a3cmx0yco2f FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: assets fkbhftyq9fchkouyot07qlqp7md; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT fkbhftyq9fchkouyot07qlqp7md FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: assets fki37wgdksbwub2fd1g8orrh975; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT fki37wgdksbwub2fd1g8orrh975 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users fki4ttvfkp7tl33d90ldkkagrxu; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fki4ttvfkp7tl33d90ldkkagrxu FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: jobs fkra3g6pshf0p0hv5aisuh3weg8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT fkra3g6pshf0p0hv5aisuh3weg8 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 2TaXtjZdEWVfqf1DzpdVvI0OHZKZXWFQGUaidIczJ7pJdosxrAgwVJpRwN7gh3V

