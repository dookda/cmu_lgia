--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg110+1)
-- Dumped by pg_dump version 17.0

-- Started on 2025-04-30 21:25:29 +07

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

--
-- TOC entry 4301 (class 1262 OID 16384)
-- Name: lgia; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE lgia WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE lgia OWNER TO postgres;

\connect lgia

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

--
-- TOC entry 2 (class 3079 OID 16385)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 4302 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 17504)
-- Name: layer_column; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.layer_column (
    gid integer NOT NULL,
    formid text,
    col_id text,
    col_name text,
    col_type text,
    col_desc text
);


ALTER TABLE public.layer_column OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17509)
-- Name: layer_column_gid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.layer_column_gid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.layer_column_gid_seq OWNER TO postgres;

--
-- TOC entry 4303 (class 0 OID 0)
-- Dependencies: 224
-- Name: layer_column_gid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.layer_column_gid_seq OWNED BY public.layer_column.gid;


--
-- TOC entry 225 (class 1259 OID 17510)
-- Name: layer_division; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.layer_division (
    id integer NOT NULL,
    division_name text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.layer_division OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17516)
-- Name: layer_division_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.layer_division_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.layer_division_id_seq OWNER TO postgres;

--
-- TOC entry 4304 (class 0 OID 0)
-- Dependencies: 226
-- Name: layer_division_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.layer_division_id_seq OWNED BY public.layer_division.id;


--
-- TOC entry 227 (class 1259 OID 17517)
-- Name: layer_name; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.layer_name (
    gid integer NOT NULL,
    formid text NOT NULL,
    division text,
    layername text,
    layertype text,
    layerstyle text,
    ts timestamp without time zone
);


ALTER TABLE public.layer_name OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17522)
-- Name: layer_name_gid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.layer_name_gid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.layer_name_gid_seq OWNER TO postgres;

--
-- TOC entry 4305 (class 0 OID 0)
-- Dependencies: 228
-- Name: layer_name_gid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.layer_name_gid_seq OWNED BY public.layer_name.gid;


--
-- TOC entry 229 (class 1259 OID 17523)
-- Name: tb_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tb_info (
    id integer NOT NULL,
    name text,
    img text
);


ALTER TABLE public.tb_info OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 17528)
-- Name: tb_info_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tb_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tb_info_id_seq OWNER TO postgres;

--
-- TOC entry 4306 (class 0 OID 0)
-- Dependencies: 230
-- Name: tb_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tb_info_id_seq OWNED BY public.tb_info.id;


--
-- TOC entry 231 (class 1259 OID 17529)
-- Name: tb_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tb_user (
    id integer NOT NULL,
    username text,
    email text,
    pass text,
    ts timestamp without time zone,
    auth text,
    division text,
    userid text,
    picture_url text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    displayname text,
    provider character varying(50) DEFAULT 'line'::character varying NOT NULL
);


ALTER TABLE public.tb_user OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 17535)
-- Name: tb_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tb_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tb_user_id_seq OWNER TO postgres;

--
-- TOC entry 4307 (class 0 OID 0)
-- Dependencies: 232
-- Name: tb_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tb_user_id_seq OWNED BY public.tb_user.id;


--
-- TOC entry 4120 (class 2604 OID 17542)
-- Name: layer_column gid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.layer_column ALTER COLUMN gid SET DEFAULT nextval('public.layer_column_gid_seq'::regclass);


--
-- TOC entry 4121 (class 2604 OID 17543)
-- Name: layer_division id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.layer_division ALTER COLUMN id SET DEFAULT nextval('public.layer_division_id_seq'::regclass);


--
-- TOC entry 4123 (class 2604 OID 17544)
-- Name: layer_name gid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.layer_name ALTER COLUMN gid SET DEFAULT nextval('public.layer_name_gid_seq'::regclass);


--
-- TOC entry 4124 (class 2604 OID 17545)
-- Name: tb_info id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tb_info ALTER COLUMN id SET DEFAULT nextval('public.tb_info_id_seq'::regclass);


--
-- TOC entry 4125 (class 2604 OID 17546)
-- Name: tb_user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tb_user ALTER COLUMN id SET DEFAULT nextval('public.tb_user_id_seq'::regclass);


--
-- TOC entry 4286 (class 0 OID 17504)
-- Dependencies: 223
-- Data for Name: layer_column; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (8, 'fid_1707956607919', 'fid_1707956607919_0', 'ชื่อถนน', 'text', 'ชื่อถนน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (9, 'fid_1707956607919', 'fid_1707956607919_1', 'ความยาว', 'numeric', 'เมตร') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (544, 'fid_1709611155681', 'fid_1709611155681_5', 'ออกให้ ณ วันที่', 'text', 'ออกให้ ณ วันที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (117, 'fid_1708398279247', 'fid_1708398279247_4', 'ความกว้าง', 'numeric', 'เมตร') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1697, 'fid_1730858469195', 'fid_1730858469195_0', '﻿ID', 'text', '﻿ID') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1698, 'fid_1730858469195', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1009, 'fid_1724643424792', 'fid_1724643424792_0', '﻿หมู่ที่', 'text', '﻿หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1010, 'fid_1724643424792', 'fid_1724643424792_1', 'จุดทิ้งขยะอันตราย', 'text', 'จุดทิ้งขยะอันตราย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (67, 'fid_1708398279247', 'fid_1708398279247_0', 'แยกทางหลวงหมายเลข ๑๑๔ (โกลบอลเฮ้าส์) - บ้านหนองปลาขอ', 'text', 'ระยะทาง ๑.๕๐๐ กิโลเมตร') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (559, 'fid_1709705247486', 'fid_1709705247486_0', '﻿รหัสประจำบ้าน', 'text', '﻿รหัสประจำบ้าน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (560, 'fid_1709705247486', 'fid_1709705247486_1', 'บ้านเลขที่', 'text', 'บ้านเลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (561, 'fid_1709705247486', 'fid_1709705247486_2', 'หมู่', 'text', 'หมู่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (562, 'fid_1709705247486', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (563, 'fid_1709705247486', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1011, 'fid_1724643424792', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1012, 'fid_1724643424792', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1013, 'fid_1724643424792', 'fid_1724643424792_4', '', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1062, 'fid_1724646615775', 'fid_1724646615775_16', 'หมู่บ้าน', 'text', 'หมู่บ้าน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1124, 'fid_1724728150293', 'fid_1724728150293_0', 'หมู่ที่', 'numeric', 'แสดงรายละเอียดหมู่บ้าน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1125, 'fid_1724728150293', 'fid_1724728150293_1', 'เลขที่แบบ', 'text', 'แสดงรายละเอียดแบบ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1126, 'fid_1724728150293', 'fid_1724728150293_2', 'ชื่อโครงการ', 'text', 'แสดงรายละเอียดโครงการ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (94, 'fid_1708399150644', 'fid_1708399150644_0', 'ลำดับ', 'numeric', 'หมายเลขกล้องCCTV') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (95, 'fid_1708399150644', 'fid_1708399150644_1', 'ชนิดกล้อง', 'text', 'ชนิดกล้องCCTV') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (96, 'fid_1708399150644', 'fid_1708399150644_2', 'วันที่ติดตั้ง', 'date', 'วันที่ติดกล้องCCTV') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (97, 'fid_1708399150644', 'fid_1708399150644_3', 'อายุการใช้งาน', 'text', 'วันที่ติดกล้องCCTV') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (98, 'fid_1708399150644', 'fid_1708399150644_4', 'ทิศทางการมอง', 'text', 'วันที่ติดกล้องCCTV') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (461, 'fid_1709607656021', 'fid_1709607656021_5', 'เลขบัตรประชาชน', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (102, 'fid_1708398279247', 'fid_1708398279247_1', 'แยกทางหลวงหมายเลข ๑๑๔', 'numeric', 'ระยะทาง ๑.๕๐๐ กิโลเมตร') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (103, 'fid_1708398279247', 'fid_1708398279247_2', 'ลพ.ถ.๒๘๐๑๐', 'numeric', 'ระยะทาง ๑.๕๐๐ กม. ผิวจราจรประเภท คอนกรีต,ลาดยาง ผิวจราจรกว้าง ๔.๐๐ ม. ไหล่ทาง/ทางเท้า กว้าง ๐.๕๐ - ๑.๐๐ ม. เขตทางกว้าง ๒.๐๐ - ๗.๐๐ ม.') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (114, 'fid_1708398279247', 'fid_1708398279247_3', 'ประเภทถนน', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (121, 'fid_1708398279247', 'fid_1708398279247_5', 'ความกว้างไหล่ทาง', 'text', 'เมตร') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (122, 'fid_1708401503316', 'fid_1708401503316_0', 'เขตในพื้นที่ตำบลเวียงยอง', 'text', 'ชื่อหมู่บ้าน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1127, 'fid_1724728150293', 'fid_1724728150293_3', 'ปริมาณงาน', 'text', 'แสดงรายละเอียดโครงการ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1128, 'fid_1724728150293', 'fid_1724728150293_4', 'งบประมาณ', 'file', 'แสดงรายละเอียดโครงการ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (476, 'fid_1709609384053', 'fid_1709609384053_8', 'ความสัมพันธ์', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1699, 'fid_1730858469195', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1700, 'fid_1730858469195', 'fid_1730858469195_3', 'ที่อยู่', 'text', 'ที่อยู่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1701, 'fid_1730858469195', 'fid_1730858469195_4', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1702, 'fid_1730858469195', 'fid_1730858469195_5', 'ประเภท', 'text', 'ประเภท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1703, 'fid_1730858469195', 'fid_1730858469195_6', 'โทรศัพท์', 'text', 'โทรศัพท์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1704, 'fid_1730858469195', 'fid_1730858469195_7', 'ชื่อสถานที่', 'text', 'ชื่อสถานที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (123, 'fid_1708401503316', 'fid_1708401503316_1', 'ชื่อสถานที่', 'text', 'ชื่อสถานที่ที่เกิดน้ำท่วม') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (551, 'fid_1709609887553', 'fid_1709609887553_3', 'หมู่ที่', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1706, 'fid_1709609887553', 'fid_1709609887553_11', 'ซ่อมแซม 2568', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1129, 'fid_1724728150293', 'fid_1724728150293_5', 'สถานที่ดำเนินการ', 'file', 'แสดงรายละเอียดโครงการ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1130, 'fid_1724728150293', 'fid_1724728150293_6', 'แบบรูปรายการ', 'file', 'แสดงรายละเอียดโครงการ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1288, 'fid_1726206369491', 'fid_1726206369491_0', 'วันที่เกิดเหตุ', 'date', 'วันที่เกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1289, 'fid_1726206369491', 'fid_1726206369491_1', 'พื้นที่ประสบภัย', 'text', 'สถานที่/ลำน้ำ/บ้านเรือนประชาชน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1290, 'fid_1726206369491', 'fid_1726206369491_2', 'การช่วยเหลือ', 'text', 'ติดตั้งสูบ/ขุดลอก/กำจัดวัชพืช/แจกกระสอบทราย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1291, 'fid_1726206369491', 'fid_1726206369491_3', 'งบประมาณที่ใช้', 'numeric', 'บาท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1292, 'fid_1726206369491', 'fid_1726206369491_4', 'วันที่สิ้นสุดเหตุ', 'date', 'วันที่สิ้นสุดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1295, 'fid_1728975344027', 'fid_1728975344027_0', 'หมู่ที่', 'numeric', 'แสดงหมู่บ้าน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (446, 'fid_1709607656021', 'fid_1709607656021_4', 'อายุ', 'numeric', 'ปี') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (975, 'fid_1724313929524', 'fid_1724313929524_1', 'ตำแหน่ง', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1131, 'fid_1724728150293', 'fid_1724728150293_7', 'แผนวิเคราะห์ (เล่มที่-หน้าที่-ข้อ)', 'text', 'แสดงรายละเอียดแผนวิเคราะห์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1132, 'fid_1724728150293', 'fid_1724728150293_8', 'เลขที่สัญญา', 'text', 'แสดงรายละเอียดสัญญาจ้าง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1133, 'fid_1724728150293', 'fid_1724728150293_9', 'ระยะเวลาสัญญาจ้าง (วันที่เริ่ม-สิ้นสุดสัญญา)', 'text', 'แสดงรายละเอียดสัญญาจ้าง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1134, 'fid_1724728150293', 'fid_1724728150293_10', 'ผู้รับจ้าง', 'text', 'แสดงรายละเอียดสัญญาจ้าง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1135, 'fid_1724728150293', 'fid_1724728150293_11', 'ระยะเวลาค้ำประกัน', 'text', 'แสดงรายละเอียดสัญญาจ้าง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1160, 'fid_1724832400986', 'fid_1724832400986_0', 'หมู่ที่', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1161, 'fid_1724832400986', 'fid_1724832400986_1', 'ชื่อบ้าน', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1162, 'fid_1724832400986', 'fid_1724832400986_2', 'ปีสำรวจ', 'date', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1163, 'fid_1724832400986', 'fid_1724832400986_3', 'หลังคาเรือน', 'numeric', 'หลัง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1164, 'fid_1724832400986', 'fid_1724832400986_4', 'ชาย', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1165, 'fid_1724832400986', 'fid_1724832400986_5', 'หญิง', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (468, 'fid_1709609384053', 'fid_1709609384053_0', 'ระดับชั้น', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (469, 'fid_1709609384053', 'fid_1709609384053_1', 'ชื่อ-นามสกุล', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (470, 'fid_1709609384053', 'fid_1709609384053_2', 'ชื่อเล่น', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (471, 'fid_1709609384053', 'fid_1709609384053_3', 'วันเดือนปีเกิด', 'date', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (472, 'fid_1709609384053', 'fid_1709609384053_4', 'อายุ', 'numeric', 'ปี') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (474, 'fid_1709609384053', 'fid_1709609384053_6', 'ที่อยู่', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (475, 'fid_1709609384053', 'fid_1709609384053_7', 'ชื่อผู้ปกครอง', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (417, 'fid_1709607656021', 'fid_1709607656021_0', 'ระดับชั้น', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (418, 'fid_1709607656021', 'fid_1709607656021_1', 'ชื่อ-นามสกุล', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (419, 'fid_1709607656021', 'fid_1709607656021_2', 'ชื่อเล่น', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (420, 'fid_1709607656021', 'fid_1709607656021_3', 'วันเดือนปีเกิด', 'date', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (511, 'fid_1709611155681', 'fid_1709611155681_0', 'เลขที่ใบอนุญาต', 'text', 'เลขที่ใบอนุญาต') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (512, 'fid_1709611155681', 'fid_1709611155681_1', 'ชื่อผู้ขออนุญาตก่อสร้าง', 'text', 'ชื่อผู้ขออนุญาตก่อสร้าง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (513, 'fid_1709611155681', 'fid_1709611155681_2', 'ชนิดอาคาร', 'text', 'ชนิดอาคาร') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (514, 'fid_1709611155681', 'fid_1709611155681_3', 'สถานที่', 'numeric', 'สถานที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (515, 'fid_1709611155681', 'fid_1709611155681_4', 'พื้นที่/ความยาว', 'numeric', 'ตร.ว./ม.') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1166, 'fid_1724832400986', 'fid_1724832400986_6', 'วันบันทึก', 'date', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1199, 'fid_1724901174228', 'fid_1724901174228_0', 'หมู่ที่', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1200, 'fid_1724901174228', 'fid_1724901174228_1', 'ชื่อบ้าน', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1293, 'fid_1726206369491', 'fid_1726206369491_5', 'ครั้งที่ 2 ', 'text', 'ว/ด/ป ที่เกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1296, 'fid_1728975344027', 'fid_1728975344027_1', 'เลขที่แบบ', 'text', 'แสดงเลขที่แบบ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (609, 'fid_1709886447365', 'fid_1709886447365_0', 'ลำดับ', 'text', 'ลำดับ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (611, 'fid_1709886447365', 'fid_1709886447365_2', 'อายุ (ปี)', 'text', 'อายุ (ปี)') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (612, 'fid_1709886447365', 'fid_1709886447365_3', 'เลขที่', 'text', 'เลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (613, 'fid_1709886447365', 'fid_1709886447365_4', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (614, 'fid_1709886447365', 'fid_1709886447365_5', '', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (615, 'fid_1709886447365', 'fid_1709886447365_6', 'วันที่ป่วย', 'text', 'วันที่ป่วย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (616, 'fid_1709886447365', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (617, 'fid_1709886447365', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1297, 'fid_1728975344027', 'fid_1728975344027_2', 'ชื่อโครงการ', 'text', 'แสดงชื่อโครงการก่อสร้าง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1298, 'fid_1728975344027', 'fid_1728975344027_3', 'ปริมาณงาน', 'text', 'แสดงรายละเอียดปริมาณงาน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1299, 'fid_1728975344027', 'fid_1728975344027_4', 'งบประมาณ', 'file', 'แสดงงบประมาณ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1300, 'fid_1728975344027', 'fid_1728975344027_5', 'สถานที่ดำเนินการ', 'file', 'แสดงรูปภาพสถานที่ดำเนินการ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1201, 'fid_1724901174228', 'fid_1724901174228_2', 'ปีสำรวจ', 'date', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1202, 'fid_1724901174228', 'fid_1724901174228_3', 'ชาย', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1203, 'fid_1724901174228', 'fid_1724901174228_4', 'หญิง', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1204, 'fid_1724901174228', 'fid_1724901174228_5', 'รวม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1205, 'fid_1724901174228', 'fid_1724901174228_6', 'วันบันทึก', 'date', ' ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1263, 'fid_1724643424792', 'fid_1724643424792_NaN', 'รูปภาพ', 'file', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1301, 'fid_1728975344027', 'fid_1728975344027_6', 'แบบรูปรายการ', 'file', 'แสดงรูปภาพแบบก่อสร้าง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1302, 'fid_1728975344027', 'fid_1728975344027_7', 'แผนวิเคราะห์ (เล่มที่-หน้าที่-ข้อ)', 'text', 'แสดงรายละเอียดในแผนวิเคราะห์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1303, 'fid_1728975344027', 'fid_1728975344027_8', 'เลขที่สัญญา', 'text', 'แสดงรายละเอียดเลขที่สัญญา') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (552, 'fid_1709609887553', 'fid_1709609887553_4', 'สวิทช์ควบคุม', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1304, 'fid_1728975344027', 'fid_1728975344027_9', 'ระยะเวลาสัญญาจ้าง', 'text', 'แสดงรายละเอียดระยะเวลาสัญญา') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (864, 'fid_1724056429838', 'fid_1724056429838_0', '1.ชื่อ/ตำแหน่ง', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (865, 'fid_1724056429838', 'fid_1724056429838_1', '2.ชื่อ/ตำแหน่ง', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (866, 'fid_1724056429838', 'fid_1724056429838_2', '3.ชื่อ/ตำแหน่ง', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (867, 'fid_1724056429838', 'fid_1724056429838_3', '4.ชื่อ/ตำแหน่ง', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (868, 'fid_1724056429838', 'fid_1724056429838_4', '5.ชื่อ/ตำแหน่ง', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (878, 'fid_1724213148820', 'fid_1724213148820_0', 'วันที่สำรวจ', 'date', 'วันที่สำรวจ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (879, 'fid_1724213148820', 'fid_1724213148820_1', 'จุดติดตั้ง', 'text', 'บริเวณที่ติดตั้ง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (880, 'fid_1724213148820', 'fid_1724213148820_2', 'สภาพ', 'text', 'ชำรุด/ปกติ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (894, 'fid_1724214181883', 'fid_1724214181883_7', 'หมู่บ้าน', 'text', 'หมู่บ้าน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (667, 'fid_1723794378233', 'fid_1723794378233_0', 'เลขที่ น.ส.ล.', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (618, 'fid_1709609887553', 'fid_1709609887553_5', 'รหัสไฟฟ้าสาธารณะ', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (621, 'fid_1709609887553', 'fid_1709609887553_8', 'ประเภท', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (896, 'fid_1724228890308', 'fid_1724228890308_0', 'วันที่สำรวจ', 'date', 'วันที่สำรวจ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (897, 'fid_1724228890308', 'fid_1724228890308_1', 'หมู่บ้าน', 'text', 'ชื่อหมู่บ้าน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (898, 'fid_1724228890308', 'fid_1724228890308_2', 'จุดติดตั้ง', 'text', 'บริเวณที่ติดตั้ง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (899, 'fid_1724228890308', 'fid_1724228890308_3', 'การติดตั้ง', 'text', 'ถาวร/ชั่วคราว') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (900, 'fid_1724228890308', 'fid_1724228890308_4', 'สภาพ', 'text', 'ชำรุด/ปกติ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (901, 'fid_1724228890308', 'fid_1724228890308_5', 'จำนวน', 'numeric', 'จำนวนการติดตั้ง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (902, 'fid_1724228890308', 'fid_1724228890308_6', 'ละติจูด', 'text', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (903, 'fid_1724228890308', 'fid_1724228890308_7', 'ลองติจูด', 'text', 'ลองติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1294, 'fid_1726206369491', 'fid_1726206369491_6', 'การช่วยเหลือ', 'text', 'ติดตั้งสูบ/กำจัดวัชพืช/กระสอบทราย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1167, 'fid_1724834814807', 'fid_1724834814807_0', 'หมู่ที่', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1168, 'fid_1724834814807', 'fid_1724834814807_1', 'ชื่อบ้าน', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1169, 'fid_1724834814807', 'fid_1724834814807_2', 'ปีสำรวจ', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1170, 'fid_1724834814807', 'fid_1724834814807_3', 'มกราคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1171, 'fid_1724834814807', 'fid_1724834814807_4', 'กุมภาพันธ์', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1172, 'fid_1724834814807', 'fid_1724834814807_5', 'มีนาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1173, 'fid_1724834814807', 'fid_1724834814807_6', 'เมษายน', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1174, 'fid_1724834814807', 'fid_1724834814807_7', 'พฤษภาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1175, 'fid_1724834814807', 'fid_1724834814807_8', 'มิถุนายน', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1176, 'fid_1724834814807', 'fid_1724834814807_9', 'กรกฎาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (724, 'fid_1723798784092', 'fid_1723798784092_0', 'หมู่บ้าน', 'numeric', 'หมู่บ้าน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (725, 'fid_1723798784092', 'fid_1723798784092_1', 'ชื่อ', 'text', 'ชื่อแหล่งน้ำสาธารณะ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1177, 'fid_1724834814807', 'fid_1724834814807_10', 'สิงหาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (727, 'fid_1723794378233', 'fid_1723794378233_1', 'หมู่ที่', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1178, 'fid_1724834814807', 'fid_1724834814807_11', 'กันยายน', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (729, 'fid_1723794378233', 'fid_1723794378233_2', 'ประเภท', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (730, 'fid_1723794378233', 'fid_1723794378233_3', 'เนื้อที่', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1305, 'fid_1728975344027', 'fid_1728975344027_10', 'ผู้รับจ้าง', 'text', 'แสดงรายละเอียดผู้รับจ้าง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1306, 'fid_1728975344027', 'fid_1728975344027_11', 'ระยะเวลาค้ำประกัน', 'text', 'แสดงรายละเอียดระยะเวลาค้ำประกัน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1179, 'fid_1724834814807', 'fid_1724834814807_12', 'ตุลาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (812, 'fid_1724050250812', 'fid_1724050250812_0', 'วันที่', 'date', 'วันที่เกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (813, 'fid_1724050250812', 'fid_1724050250812_1', 'เวลา', 'numeric', 'เวลาที่เกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (814, 'fid_1724050250812', 'fid_1724050250812_2', 'สถานที่', 'text', 'สถานที่เกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (815, 'fid_1724050250812', 'fid_1724050250812_3', 'ชื่อ - สกุล', 'text', 'ชื่อผู้ประสบอุบัติเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (816, 'fid_1724050250812', 'fid_1724050250812_4', 'เพศ', 'text', 'ชาย/หญิง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (942, 'fid_1724229996810', 'fid_1724229996810_6', 'ละติจูด', 'text', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (817, 'fid_1724050250812', 'fid_1724050250812_5', 'อายุ', 'numeric', 'อายุผู้ประสบอุบัติเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (818, 'fid_1724050250812', 'fid_1724050250812_6', 'ยานพาหนะ', 'text', 'ยานพาหนะที่เกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (819, 'fid_1724050250812', 'fid_1724050250812_7', 'สาเหตุ', 'text', 'สาเหตุการเกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (820, 'fid_1724050250812', 'fid_1724050250812_8', 'ลักษณะ', 'text', 'ลัษณะจุดเกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (821, 'fid_1724050250812', 'fid_1724050250812_9', 'อาการ', 'text', 'ลักษณะการบาดเจ็บ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (822, 'fid_1724050250812', 'fid_1724050250812_10', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (823, 'fid_1724050250812', 'fid_1724050250812_11', 'ลองติจูด', 'numeric', 'ลองติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (848, 'fid_1723794378233', 'fid_1723794378233_4', 'รูป ', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (887, 'fid_1724214181883', 'fid_1724214181883_0', 'วันที่สำรวจ', 'date', 'วันที่สำรวจ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (888, 'fid_1724214181883', 'fid_1724214181883_1', 'จุดติดตั้ง', 'text', 'บริเวณที่ติดตั้ง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (889, 'fid_1724214181883', 'fid_1724214181883_2', 'ขนาด', 'text', 'ขนาดกระจกโค้ง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (890, 'fid_1724214181883', 'fid_1724214181883_3', 'จำนวน', 'numeric', 'จำนวนกระจกโค้ง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (891, 'fid_1724214181883', 'fid_1724214181883_4', 'สภาพ', 'text', 'ชำรุด/ปกติ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (892, 'fid_1724214181883', 'fid_1724214181883_5', 'ละติจูด', 'text', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (893, 'fid_1724214181883', 'fid_1724214181883_6', 'ลองติจูด', 'text', 'ลองติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (895, 'fid_1709609887553', 'fid_1709609887553_9', 'การติดตั้ง', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1180, 'fid_1724834814807', 'fid_1724834814807_13', 'พฤศจิกายน', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1181, 'fid_1724834814807', 'fid_1724834814807_14', 'ธันวาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1206, 'fid_1725247161617', 'fid_1725247161617_0', 'วันที่เกิดเหตุ', 'date', 'วันที่เกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (976, 'fid_1724395600415', 'fid_1724395600415_0', 'ชื่อ - สกุล', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1207, 'fid_1725247161617', 'fid_1725247161617_1', 'พื้นที่เสี่ยงภัย', 'text', 'บ้านเลขที่/ชื่อสถานที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1208, 'fid_1725247161617', 'fid_1725247161617_2', 'ผู้ประสบภัย', 'text', 'ชื่อ-สกุล ผู้ประสบภัย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1209, 'fid_1725247161617', 'fid_1725247161617_3', 'การช่วยเหลือ', 'text', 'การช่วยเหลือ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1210, 'fid_1725247161617', 'fid_1725247161617_4', 'งบประมาณที่ใช้', 'numeric', 'บาท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1211, 'fid_1725247161617', 'fid_1725247161617_5', 'วันที่สิ้นสุดภัย', 'date', 'วันที่สิ้นสุดภัย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1357, 'fid_1730268646141', 'fid_1730268646141_0', 'ชื่อผู้ใช้ประกอบพาณิชยกิจ', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1358, 'fid_1730268646141', 'fid_1730268646141_1', 'ที่อยู่ประกอบการ', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1359, 'fid_1730268646141', 'fid_1730268646141_2', 'คำขอจัดตั้งเลขที่', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1360, 'fid_1730268646141', 'fid_1730268646141_3', 'ทะเบียนเลขที่', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1361, 'fid_1730268646141', 'fid_1730268646141_4', 'วันที่จดทะเบียนพาณิชย์', 'date', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1362, 'fid_1730268646141', 'fid_1730268646141_5', 'ชื่อประกอบการพาณิชย์', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1363, 'fid_1730268646141', 'fid_1730268646141_6', 'ชนิดแห่งพาณิชยกิจ', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1364, 'fid_1730268646141', 'fid_1730268646141_7', 'ที่ตั้งสำนักงานใหญ่', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1369, 'fid_1709611155681', 'fid_1709611155681_6', 'รูปภาพ', 'file', 'ภาพถ่ายใบอนุญาต') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1253, 'fid_1725359781006', 'fid_1725359781006_0', '﻿หมู่ที่', 'text', '﻿หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1254, 'fid_1725359781006', 'fid_1725359781006_1', 'เลขที่', 'text', 'เลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1255, 'fid_1725359781006', 'fid_1725359781006_2', 'ชนิดของเครื่อง', 'text', 'ชนิดของเครื่อง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1256, 'fid_1725359781006', 'fid_1725359781006_3', 'หมายเลขเครื่อง', 'text', 'หมายเลขเครื่อง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1257, 'fid_1725359781006', 'fid_1725359781006_4', 'หมายเลขทะเบียน', 'text', 'หมายเลขทะเบียน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1258, 'fid_1725359781006', 'fid_1725359781006_5', 'สถานที่', 'text', 'สถานที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1259, 'fid_1725359781006', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1260, 'fid_1725359781006', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1261, 'fid_1725359781006', 'fid_1725359781006_8', 'คำร้องเลขที่', 'text', 'คำร้องเลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1262, 'fid_1725359781006', 'fid_1725359781006_9', 'วันเดือนปีที่ร้อง', 'text', 'วันเดือนปีที่ร้อง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1272, 'fid_1725517670938', 'fid_1725517670938_0', '﻿ลำดับ', 'text', '﻿ลำดับ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1273, 'fid_1725517670938', 'fid_1725517670938_1', 'รายชื่อ', 'text', 'รายชื่อ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1274, 'fid_1725517670938', 'fid_1725517670938_2', 'บ้านเลขที่', 'text', 'บ้านเลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1275, 'fid_1725517670938', 'fid_1725517670938_3', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1276, 'fid_1725517670938', 'fid_1725517670938_4', 'เบอร์โทร', 'text', 'เบอร์โทร') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1277, 'fid_1725517670938', 'fid_1725517670938_5', 'ผู้รับผิดชอบ', 'text', 'ผู้รับผิดชอบ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1278, 'fid_1725517670938', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1279, 'fid_1725517670938', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (936, 'fid_1724229996810', 'fid_1724229996810_0', 'วันที่เกิดเหตุ', 'date', 'วันที่เกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (937, 'fid_1724229996810', 'fid_1724229996810_1', 'หมู่บ้าน', 'text', 'ชื่อหมู่บ้าน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (938, 'fid_1724229996810', 'fid_1724229996810_2', 'พื้นที่ที่เกิดเหตุ', 'text', 'พื้นที่ที่เกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (939, 'fid_1724229996810', 'fid_1724229996810_3', 'อุณหภูมิ', 'text', 'อุณหภูมิในวันที่เกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (940, 'fid_1724229996810', 'fid_1724229996810_4', 'การช่วยเหลือ', 'text', 'การช่วยเหลือ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (941, 'fid_1724229996810', 'fid_1724229996810_5', 'วันที่สิ้นสุดภัย', 'text', 'วันที่สิ้นสุดภัย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (943, 'fid_1724229996810', 'fid_1724229996810_7', 'ลองติจูด', 'text', 'ลองติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (973, 'fid_1709609887553', 'fid_1709609887553_10', 'รูปแผนที่', 'file', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (947, 'fid_1724230154020', 'fid_1724230154020_0', 'วันที่เกิดเหตุ', 'date', 'วันที่เกิดเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (948, 'fid_1724230154020', 'fid_1724230154020_1', 'หมู่บ้าน', 'text', 'ชื่อหมู่บ้าน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (949, 'fid_1724230154020', 'fid_1724230154020_2', 'พื้นที่ที่ได้รับความเสียหาย', 'text', 'พื้นที่ที่ได้รับความเสียหาย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (950, 'fid_1724230154020', 'fid_1724230154020_3', 'การช่วยเหลือ', 'text', 'การช่วยเหลือ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (951, 'fid_1724230154020', 'fid_1724230154020_4', 'ความรุนแรงของแผ่นดินไหว', 'text', 'ริกเตอร์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (952, 'fid_1724230154020', 'fid_1724230154020_5', 'วันที่สิ้นสุดภัย', 'date', 'วันที่สิ้นสุดภัย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (953, 'fid_1724230154020', 'fid_1724230154020_6', 'ละติจูด', 'text', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (954, 'fid_1724230154020', 'fid_1724230154020_7', 'ลองติจูด', 'text', 'ลองติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (965, 'fid_1724301032527', 'fid_1724301032527_0', 'วันเกิดภัย', 'date', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (966, 'fid_1724301032527', 'fid_1724301032527_1', 'หมู่ที่', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (967, 'fid_1724301032527', 'fid_1724301032527_2', 'ตำแหน่ง/สถานที่', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (968, 'fid_1724301032527', 'fid_1724301032527_3', 'ต้นเพลิง', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (969, 'fid_1724301032527', 'fid_1724301032527_4', 'ความเสียหาย', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (970, 'fid_1724301032527', 'fid_1724301032527_5', 'การช่วยเหลือ', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (971, 'fid_1724301032527', 'fid_1724301032527_6', 'งบประมาณ', 'numeric', 'บาท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (972, 'fid_1724301032527', 'fid_1724301032527_7', 'วันรายงาน', 'date', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (974, 'fid_1724313929524', 'fid_1724313929524_0', 'ชื่อ - สกุล', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (977, 'fid_1724395600415', 'fid_1724395600415_1', 'ตำแหน่ง', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (978, 'fid_1724640422415', 'fid_1724640422415_0', 'ลำดับ', 'text', 'ลำดับ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (979, 'fid_1724640422415', 'fid_1724640422415_1', 'ชื่อผู้ประกอบการ', 'text', 'ชื่อผู้ประกอบการ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (980, 'fid_1724640422415', 'fid_1724640422415_2', 'ชื่อสถานประกอบการ', 'text', 'ชื่อสถานประกอบการ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (981, 'fid_1724640422415', 'fid_1724640422415_3', 'ที่อยู่', 'text', 'ที่อยู่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (982, 'fid_1724640422415', 'fid_1724640422415_4', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (983, 'fid_1724640422415', 'fid_1724640422415_5', 'เลขที่', 'text', 'เลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (984, 'fid_1724640422415', 'fid_1724640422415_6', 'คำร้อง (ปี-เดือน-วัน)', 'text', 'คำร้อง (ปี-เดือน-วัน)') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (985, 'fid_1724640422415', 'fid_1724640422415_7', 'ประเภท', 'text', 'ประเภท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (986, 'fid_1724640422415', 'fid_1724640422415_8', 'ประเภท2', 'text', 'ประเภท2') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (987, 'fid_1724640422415', 'fid_1724640422415_9', 'ประเภท3', 'text', 'ประเภท3') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (988, 'fid_1724640422415', 'fid_1724640422415_10', 'ประเภท4', 'text', 'ประเภท4') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (989, 'fid_1724640422415', 'fid_1724640422415_11', 'ใบอนุญาต(เล่มที่/เลขที่)', 'text', 'ใบอนุญาต(เล่มที่/เลขที่)') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (990, 'fid_1724640422415', 'fid_1724640422415_12', 'ปี-เดือน-วัน(ที่ออก)', 'text', 'ปี-เดือน-วัน(ที่ออก)') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (991, 'fid_1724640422415', 'fid_1724640422415_13', 'จำนวนเงิน', 'text', 'จำนวนเงิน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (992, 'fid_1724640422415', 'fid_1724640422415_14', 'หมายเหตุ', 'text', 'หมายเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (993, 'fid_1724640422415', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (994, 'fid_1724640422415', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (995, 'fid_1724640736812', 'fid_1724640736812_0', 'ลำดับ', 'text', 'ลำดับ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (996, 'fid_1724640736812', 'fid_1724640736812_1', 'ชื่อผู้ประกอบการ', 'text', 'ชื่อผู้ประกอบการ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (997, 'fid_1724640736812', 'fid_1724640736812_2', 'ชื่อสถานประกอบการ', 'text', 'ชื่อสถานประกอบการ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (998, 'fid_1724640736812', 'fid_1724640736812_3', 'ที่อยู่', 'text', 'ที่อยู่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (999, 'fid_1724640736812', 'fid_1724640736812_4', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1000, 'fid_1724640736812', 'fid_1724640736812_5', 'เลขที่', 'text', 'เลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1001, 'fid_1724640736812', 'fid_1724640736812_6', 'คำร้อง (ปี-เดือน-วัน)', 'text', 'คำร้อง (ปี-เดือน-วัน)') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1002, 'fid_1724640736812', 'fid_1724640736812_7', 'ประเภท', 'text', 'ประเภท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1003, 'fid_1724640736812', 'fid_1724640736812_8', 'ใบอนุญาต(เล่มที่/เลขที่)', 'text', 'ใบอนุญาต(เล่มที่/เลขที่)') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1004, 'fid_1724640736812', 'fid_1724640736812_9', 'ปี-เดือน-วัน(ที่ออก)', 'text', 'ปี-เดือน-วัน(ที่ออก)') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1005, 'fid_1724640736812', 'fid_1724640736812_10', 'จำนวนเงิน', 'text', 'จำนวนเงิน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1006, 'fid_1724640736812', 'fid_1724640736812_11', 'หมายเหตุ', 'text', 'หมายเหตุ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1007, 'fid_1724640736812', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1008, 'fid_1724640736812', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1434, 'fid_1730798749966', 'fid_1730798749966_0', '﻿ที่อยู่', 'text', '﻿ที่อยู่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1046, 'fid_1724646615775', 'fid_1724646615775_0', 'วันที่เกิดภัย ครั้งที่ 1 ', 'date', 'วันที่เกิดภัย ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1047, 'fid_1724646615775', 'fid_1724646615775_1', 'จำนวนผู้ประสบภัย', 'numeric', 'ครัวเรือน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1048, 'fid_1724646615775', 'fid_1724646615775_2', 'จำนวนกระเบื้อง', 'numeric', 'แผ่น') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1049, 'fid_1724646615775', 'fid_1724646615775_3', 'จำนวนครอบหลังคา', 'numeric', 'แผ่น') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1050, 'fid_1724646615775', 'fid_1724646615775_4', 'จำนวนสังกะสี', 'numeric', 'แผ่น') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1051, 'fid_1724646615775', 'fid_1724646615775_5', 'การช่วยเหลืออื่น ๆ', 'text', 'อื่น ๆ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1052, 'fid_1724646615775', 'fid_1724646615775_6', 'งบประมาณที่ใช้', 'numeric', 'บาท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1053, 'fid_1724646615775', 'fid_1724646615775_7', 'วันสิ้นสุดภัย ครั้งที่ 1', 'date', 'วันที่สิ้นสุดภัย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1054, 'fid_1724646615775', 'fid_1724646615775_8', 'วันที่เกิดภัย ครั้งที่ 2', 'date', 'วันที่เกิดภัย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1055, 'fid_1724646615775', 'fid_1724646615775_9', 'จำนวนผู้ประสบภัย', 'numeric', 'ครัวเรือน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1056, 'fid_1724646615775', 'fid_1724646615775_10', 'จำนวนกระเบื้อง', 'numeric', 'แผ่น') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1057, 'fid_1724646615775', 'fid_1724646615775_11', 'จำนวนครอบหลังคา', 'numeric', 'แผ่น') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1058, 'fid_1724646615775', 'fid_1724646615775_12', 'จำนวนสังกะสี', 'numeric', 'แผ่น') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1059, 'fid_1724646615775', 'fid_1724646615775_13', 'การช่วยเหลืออื่น ๆ', 'text', 'อื่น ๆ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1060, 'fid_1724646615775', 'fid_1724646615775_14', 'งบประมาณที่ใช้', 'numeric', 'บาท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1061, 'fid_1724646615775', 'fid_1724646615775_15', 'วันที่สิ้นสุดภัย ครั้งที่ 2', 'date', 'วันที่สิ้นสุดภัย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1184, 'fid_1724899698690', 'fid_1724899698690_0', 'หมู่ที่ ', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1185, 'fid_1724899698690', 'fid_1724899698690_1', 'ชื่อบ้าน', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1186, 'fid_1724899698690', 'fid_1724899698690_2', 'ปีสำรวจ', 'date', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1187, 'fid_1724899698690', 'fid_1724899698690_3', 'มกราคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1188, 'fid_1724899698690', 'fid_1724899698690_4', 'กุมภาพันธ์', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1189, 'fid_1724899698690', 'fid_1724899698690_5', 'มีนาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1190, 'fid_1724899698690', 'fid_1724899698690_6', 'เมษายน', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1191, 'fid_1724899698690', 'fid_1724899698690_7', 'พฤษภาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1192, 'fid_1724899698690', 'fid_1724899698690_8', 'มิถุนายน', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1193, 'fid_1724899698690', 'fid_1724899698690_9', 'กรกฎาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1194, 'fid_1724899698690', 'fid_1724899698690_10', 'สิงหาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1195, 'fid_1724899698690', 'fid_1724899698690_11', 'กันยายน', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1196, 'fid_1724899698690', 'fid_1724899698690_12', 'ตุลาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1197, 'fid_1724899698690', 'fid_1724899698690_13', 'พฤศจิกายน', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1198, 'fid_1724899698690', 'fid_1724899698690_14', 'ธันวาคม', 'numeric', 'คน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1435, 'fid_1730798749966', 'fid_1730798749966_1', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1436, 'fid_1730798749966', 'fid_1730798749966_2', 'ชื่อสถานที่', 'text', 'ชื่อสถานที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1322, 'fid_1730259014226', 'fid_1730259014226_0', 'ชื่อร้านผู้ประกอบการ', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1323, 'fid_1730259014226', 'fid_1730259014226_1', 'ชื่อ-นามสกุล ', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1324, 'fid_1730259014226', 'fid_1730259014226_2', 'ที่อยู่', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1326, 'fid_1730259014226', 'fid_1730259014226_4', 'ประเภทของป้าย', 'text', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1437, 'fid_1730798749966', 'fid_1730798749966_3', 'ประเภท', 'text', 'ประเภท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1438, 'fid_1730798749966', 'fid_1730798749966_4', 'โทรศัพท์', 'text', 'โทรศัพท์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1439, 'fid_1730798749966', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1325, 'fid_1730259014226', 'fid_1730259014226_3', 'เบอร์โทรศัพท์', 'numeric', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1440, 'fid_1730798749966', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1707, 'fid_1740551545438', 'fid_1740551545438_0', 'ss', 'TEXT', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1708, 'fid_1740551545438', 'fid_1740551545438_1', 'ttt', 'DATE', '') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1709, 'fid_1740615381187', 'fid_1740615381187_0', '﻿ID', 'text', '﻿ID') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1710, 'fid_1740615381187', 'fid_1740615381187_1', 'ชื่อ-นามสกุล', 'text', 'ชื่อ-นามสกุล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1711, 'fid_1740615381187', 'fid_1740615381187_2', 'หมายเลขบัตรประชาชน', 'text', 'หมายเลขบัตรประชาชน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1712, 'fid_1740615381187', 'fid_1740615381187_3', 'เบอร์โทรศัพท์', 'text', 'เบอร์โทรศัพท์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1713, 'fid_1740615381187', 'fid_1740615381187_4', 'hhcode', 'text', 'hhcode') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1714, 'fid_1740615381187', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1715, 'fid_1740615381187', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1716, 'fid_1740615381187', 'fid_1740615381187_7', 'บ้านเลขที่', 'text', 'บ้านเลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1717, 'fid_1740615381187', 'fid_1740615381187_8', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1718, 'fid_1740615381187', 'fid_1740615381187_9', 'ซอย', 'text', 'ซอย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1719, 'fid_1740615381187', 'fid_1740615381187_10', 'ถนน', 'text', 'ถนน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1720, 'fid_1740615381187', 'fid_1740615381187_11', 'ประเภท', 'text', 'ประเภท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1721, 'fid_1740615381187', 'fid_1740615381187_12', 'ชื่อ/อัตลักษณ์', 'text', 'ชื่อ/อัตลักษณ์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1722, 'fid_1740615381187', 'fid_1740615381187_13', 'เพศ', 'text', 'เพศ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1723, 'fid_1740615381187', 'fid_1740615381187_14', 'การฉีดวัคซีน', 'text', 'การฉีดวัคซีน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1724, 'fid_1740615381187', 'fid_1740615381187_15', 'วัคซีนครั้งล่าสุด', 'text', 'วัคซีนครั้งล่าสุด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1725, 'fid_1740615381187', 'fid_1740615381187_16', 'การทำหมัน', 'text', 'การทำหมัน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1726, 'fid_1740615381187', 'fid_1740615381187_17', 'ปีเกิด', 'text', 'ปีเกิด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1727, 'fid_1740615381187', 'fid_1740615381187_18', 'อายุ-ปี', 'text', 'อายุ-ปี') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1728, 'fid_1740615381187', 'fid_1740615381187_19', 'อายุ-เดือน', 'text', 'อายุ-เดือน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1729, 'fid_1740615381187', 'fid_1740615381187_20', 'ลักษณะการเลี้ยง', 'text', 'ลักษณะการเลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1730, 'fid_1740615381187', 'fid_1740615381187_21', 'สถานที่เลี้ยง', 'text', 'สถานที่เลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1731, 'fid_1740615381187', 'fid_1740615381187_22', 'ปีสำรวจ', 'text', 'ปีสำรวจ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1732, 'fid_1740615381187', 'fid_1740615381187_23', 'รอบที่', 'text', 'รอบที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1851, 'fid_1740617298873', 'fid_1740617298873_18', 'ปีสำรวจ', 'text', 'ปีสำรวจ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1733, 'fid_1740615381187', 'fid_1740615381187_24', 'วันที่บันทึกข้อมูล', 'text', 'วันที่บันทึกข้อมูล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1734, 'fid_1740615381187', 'fid_1740615381187_25', 'ผู้บันทึก', 'text', 'ผู้บันทึก') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1735, 'fid_1740615381187', 'fid_1740615381187_26', 'วันที่ปรับปรุงข้อมูลล่าสุด', 'text', 'วันที่ปรับปรุงข้อมูลล่าสุด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1736, 'fid_1740615381187', 'fid_1740615381187_27', 'ผู้ปรับปรุง', 'text', 'ผู้ปรับปรุง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1737, 'fid_1740615381187', 'fid_1740615381187_28', 'อนุมัติโดย', 'text', 'อนุมัติโดย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1738, 'fid_1740615381187', 'fid_1740615381187_29', 'วันที่อนุมัติ', 'text', 'วันที่อนุมัติ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1739, 'fid_1740615381187', 'fid_1740615381187_30', 'สถานะ', 'text', 'สถานะ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1740, 'fid_1740615879639', 'fid_1740615879639_0', '﻿ID', 'text', '﻿ID') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1741, 'fid_1740615879639', 'fid_1740615879639_1', 'ชื่อ-นามสกุล', 'text', 'ชื่อ-นามสกุล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1742, 'fid_1740615879639', 'fid_1740615879639_2', 'หมายเลขบัตรประชาชน', 'text', 'หมายเลขบัตรประชาชน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1743, 'fid_1740615879639', 'fid_1740615879639_3', 'เบอร์โทรศัพท์', 'text', 'เบอร์โทรศัพท์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1744, 'fid_1740615879639', 'fid_1740615879639_4', 'hhcode', 'text', 'hhcode') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1745, 'fid_1740615879639', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1746, 'fid_1740615879639', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1747, 'fid_1740615879639', 'fid_1740615879639_7', 'บ้านเลขที่', 'text', 'บ้านเลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1748, 'fid_1740615879639', 'fid_1740615879639_8', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1749, 'fid_1740615879639', 'fid_1740615879639_9', 'ซอย', 'text', 'ซอย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1750, 'fid_1740615879639', 'fid_1740615879639_10', 'ถนน', 'text', 'ถนน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1751, 'fid_1740615879639', 'fid_1740615879639_11', 'ประเภท', 'text', 'ประเภท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1810, 'fid_1740616523754', 'fid_1740616523754_8', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1752, 'fid_1740615879639', 'fid_1740615879639_12', 'ชื่อ/อัตลักษณ์', 'text', 'ชื่อ/อัตลักษณ์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1753, 'fid_1740615879639', 'fid_1740615879639_13', 'เพศ', 'text', 'เพศ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1754, 'fid_1740615879639', 'fid_1740615879639_14', 'การฉีดวัคซีน', 'text', 'การฉีดวัคซีน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1755, 'fid_1740615879639', 'fid_1740615879639_15', 'วัคซีนครั้งล่าสุด', 'text', 'วัคซีนครั้งล่าสุด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1756, 'fid_1740615879639', 'fid_1740615879639_16', 'การทำหมัน', 'text', 'การทำหมัน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1757, 'fid_1740615879639', 'fid_1740615879639_17', 'ปีเกิด', 'text', 'ปีเกิด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1758, 'fid_1740615879639', 'fid_1740615879639_18', 'อายุ-ปี', 'text', 'อายุ-ปี') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1759, 'fid_1740615879639', 'fid_1740615879639_19', 'อายุ-เดือน', 'text', 'อายุ-เดือน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1760, 'fid_1740615879639', 'fid_1740615879639_20', 'ลักษณะการเลี้ยง', 'text', 'ลักษณะการเลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1761, 'fid_1740615879639', 'fid_1740615879639_21', 'สถานที่เลี้ยง', 'text', 'สถานที่เลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1762, 'fid_1740615879639', 'fid_1740615879639_22', 'ปีสำรวจ', 'text', 'ปีสำรวจ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1763, 'fid_1740615879639', 'fid_1740615879639_23', 'รอบที่', 'text', 'รอบที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1764, 'fid_1740615879639', 'fid_1740615879639_24', 'วันที่บันทึกข้อมูล', 'text', 'วันที่บันทึกข้อมูล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1765, 'fid_1740615879639', 'fid_1740615879639_25', 'ผู้บันทึก', 'text', 'ผู้บันทึก') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1766, 'fid_1740615879639', 'fid_1740615879639_26', 'วันที่ปรับปรุงข้อมูลล่าสุด', 'text', 'วันที่ปรับปรุงข้อมูลล่าสุด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1767, 'fid_1740615879639', 'fid_1740615879639_27', 'ผู้ปรับปรุง', 'text', 'ผู้ปรับปรุง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1768, 'fid_1740615879639', 'fid_1740615879639_28', 'อนุมัติโดย', 'text', 'อนุมัติโดย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1769, 'fid_1740615879639', 'fid_1740615879639_29', 'วันที่อนุมัติ', 'text', 'วันที่อนุมัติ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1770, 'fid_1740615879639', 'fid_1740615879639_30', 'สถานะ', 'text', 'สถานะ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1771, 'fid_1740616268393', 'fid_1740616268393_0', '﻿ID', 'text', '﻿ID') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1772, 'fid_1740616268393', 'fid_1740616268393_1', 'ชื่อ-นามสกุล', 'text', 'ชื่อ-นามสกุล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1773, 'fid_1740616268393', 'fid_1740616268393_2', 'หมายเลขบัตรประชาชน', 'text', 'หมายเลขบัตรประชาชน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1774, 'fid_1740616268393', 'fid_1740616268393_3', 'เบอร์โทรศัพท์', 'text', 'เบอร์โทรศัพท์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1775, 'fid_1740616268393', 'fid_1740616268393_4', 'hhcode', 'text', 'hhcode') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1776, 'fid_1740616268393', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1777, 'fid_1740616268393', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1778, 'fid_1740616268393', 'fid_1740616268393_7', 'บ้านเลขที่', 'text', 'บ้านเลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1779, 'fid_1740616268393', 'fid_1740616268393_8', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1780, 'fid_1740616268393', 'fid_1740616268393_9', 'ซอย', 'text', 'ซอย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1781, 'fid_1740616268393', 'fid_1740616268393_10', 'ถนน', 'text', 'ถนน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1782, 'fid_1740616268393', 'fid_1740616268393_11', 'ประเภท', 'text', 'ประเภท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1783, 'fid_1740616268393', 'fid_1740616268393_12', 'ชื่อ/อัตลักษณ์', 'text', 'ชื่อ/อัตลักษณ์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1784, 'fid_1740616268393', 'fid_1740616268393_13', 'เพศ', 'text', 'เพศ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1785, 'fid_1740616268393', 'fid_1740616268393_14', 'การฉีดวัคซีน', 'text', 'การฉีดวัคซีน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1786, 'fid_1740616268393', 'fid_1740616268393_15', 'วัคซีนครั้งล่าสุด', 'text', 'วัคซีนครั้งล่าสุด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1787, 'fid_1740616268393', 'fid_1740616268393_16', 'การทำหมัน', 'text', 'การทำหมัน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1788, 'fid_1740616268393', 'fid_1740616268393_17', 'ปีเกิด', 'text', 'ปีเกิด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1789, 'fid_1740616268393', 'fid_1740616268393_18', 'อายุ-ปี', 'text', 'อายุ-ปี') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1790, 'fid_1740616268393', 'fid_1740616268393_19', 'อายุ-เดือน', 'text', 'อายุ-เดือน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1791, 'fid_1740616268393', 'fid_1740616268393_20', 'ลักษณะการเลี้ยง', 'text', 'ลักษณะการเลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1792, 'fid_1740616268393', 'fid_1740616268393_21', 'สถานที่เลี้ยง', 'text', 'สถานที่เลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1793, 'fid_1740616268393', 'fid_1740616268393_22', 'ปีสำรวจ', 'text', 'ปีสำรวจ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1794, 'fid_1740616268393', 'fid_1740616268393_23', 'รอบที่', 'text', 'รอบที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1795, 'fid_1740616268393', 'fid_1740616268393_24', 'วันที่บันทึกข้อมูล', 'text', 'วันที่บันทึกข้อมูล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1796, 'fid_1740616268393', 'fid_1740616268393_25', 'ผู้บันทึก', 'text', 'ผู้บันทึก') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1797, 'fid_1740616268393', 'fid_1740616268393_26', 'วันที่ปรับปรุงข้อมูลล่าสุด', 'text', 'วันที่ปรับปรุงข้อมูลล่าสุด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1798, 'fid_1740616268393', 'fid_1740616268393_27', 'ผู้ปรับปรุง', 'text', 'ผู้ปรับปรุง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1799, 'fid_1740616268393', 'fid_1740616268393_28', 'อนุมัติโดย', 'text', 'อนุมัติโดย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1800, 'fid_1740616268393', 'fid_1740616268393_29', 'วันที่อนุมัติ', 'text', 'วันที่อนุมัติ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1801, 'fid_1740616268393', 'fid_1740616268393_30', 'สถานะ', 'text', 'สถานะ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1802, 'fid_1740616523754', 'fid_1740616523754_0', '﻿ID', 'text', '﻿ID') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1803, 'fid_1740616523754', 'fid_1740616523754_1', 'ชื่อ-นามสกุล', 'text', 'ชื่อ-นามสกุล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1804, 'fid_1740616523754', 'fid_1740616523754_2', 'หมายเลขบัตรประชาชน', 'text', 'หมายเลขบัตรประชาชน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1805, 'fid_1740616523754', 'fid_1740616523754_3', 'เบอร์โทรศัพท์', 'text', 'เบอร์โทรศัพท์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1806, 'fid_1740616523754', 'fid_1740616523754_4', 'hhcode', 'text', 'hhcode') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1807, 'fid_1740616523754', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1808, 'fid_1740616523754', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1809, 'fid_1740616523754', 'fid_1740616523754_7', 'บ้านเลขที่', 'text', 'บ้านเลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1811, 'fid_1740616523754', 'fid_1740616523754_9', 'ซอย', 'text', 'ซอย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1812, 'fid_1740616523754', 'fid_1740616523754_10', 'ถนน', 'text', 'ถนน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1813, 'fid_1740616523754', 'fid_1740616523754_11', 'ประเภท', 'text', 'ประเภท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1814, 'fid_1740616523754', 'fid_1740616523754_12', 'ชื่อ/อัตลักษณ์', 'text', 'ชื่อ/อัตลักษณ์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1815, 'fid_1740616523754', 'fid_1740616523754_13', 'เพศ', 'text', 'เพศ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1816, 'fid_1740616523754', 'fid_1740616523754_14', 'การฉีดวัคซีน', 'text', 'การฉีดวัคซีน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1817, 'fid_1740616523754', 'fid_1740616523754_15', 'วัคซีนครั้งล่าสุด', 'text', 'วัคซีนครั้งล่าสุด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1818, 'fid_1740616523754', 'fid_1740616523754_16', 'การทำหมัน', 'text', 'การทำหมัน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1819, 'fid_1740616523754', 'fid_1740616523754_17', 'ปีเกิด', 'text', 'ปีเกิด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1820, 'fid_1740616523754', 'fid_1740616523754_18', 'อายุ-ปี', 'text', 'อายุ-ปี') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1821, 'fid_1740616523754', 'fid_1740616523754_19', 'อายุ-เดือน', 'text', 'อายุ-เดือน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1822, 'fid_1740616523754', 'fid_1740616523754_20', 'ลักษณะการเลี้ยง', 'text', 'ลักษณะการเลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1823, 'fid_1740616523754', 'fid_1740616523754_21', 'สถานที่เลี้ยง', 'text', 'สถานที่เลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1824, 'fid_1740616523754', 'fid_1740616523754_22', 'ปีสำรวจ', 'text', 'ปีสำรวจ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1825, 'fid_1740616523754', 'fid_1740616523754_23', 'รอบที่', 'text', 'รอบที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1826, 'fid_1740616523754', 'fid_1740616523754_24', 'วันที่บันทึกข้อมูล', 'text', 'วันที่บันทึกข้อมูล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1827, 'fid_1740616523754', 'fid_1740616523754_25', 'ผู้บันทึก', 'text', 'ผู้บันทึก') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1828, 'fid_1740616523754', 'fid_1740616523754_26', 'วันที่ปรับปรุงข้อมูลล่าสุด', 'text', 'วันที่ปรับปรุงข้อมูลล่าสุด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1829, 'fid_1740616523754', 'fid_1740616523754_27', 'ผู้ปรับปรุง', 'text', 'ผู้ปรับปรุง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1830, 'fid_1740616523754', 'fid_1740616523754_28', 'อนุมัติโดย', 'text', 'อนุมัติโดย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1831, 'fid_1740616523754', 'fid_1740616523754_29', 'วันที่อนุมัติ', 'text', 'วันที่อนุมัติ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1832, 'fid_1740616523754', 'fid_1740616523754_30', 'สถานะ', 'text', 'สถานะ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1833, 'fid_1740617298873', 'fid_1740617298873_0', 'ID', 'text', 'ID') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1834, 'fid_1740617298873', 'fid_1740617298873_1', 'ชื่อ-นามสกุล', 'text', 'ชื่อ-นามสกุล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1835, 'fid_1740617298873', 'fid_1740617298873_2', 'หมายเลขบัตรประชาชน', 'text', 'หมายเลขบัตรประชาชน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1836, 'fid_1740617298873', 'fid_1740617298873_3', 'เบอร์โทรศัพท์', 'text', 'เบอร์โทรศัพท์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1837, 'fid_1740617298873', 'fid_1740617298873_4', 'hhcode', 'text', 'hhcode') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1838, 'fid_1740617298873', 'lat', 'lat', 'numeric', 'lat') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1839, 'fid_1740617298873', 'lng', 'lng', 'numeric', 'lng') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1840, 'fid_1740617298873', 'fid_1740617298873_7', 'บ้านเลขที่', 'text', 'บ้านเลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1841, 'fid_1740617298873', 'fid_1740617298873_8', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1842, 'fid_1740617298873', 'fid_1740617298873_9', 'ประเภท', 'text', 'ประเภท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1843, 'fid_1740617298873', 'fid_1740617298873_10', 'ชื่อ/อัตลักษณ์', 'text', 'ชื่อ/อัตลักษณ์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1844, 'fid_1740617298873', 'fid_1740617298873_11', 'เพศ', 'text', 'เพศ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1845, 'fid_1740617298873', 'fid_1740617298873_12', 'การฉีดวัคซีน', 'text', 'การฉีดวัคซีน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1846, 'fid_1740617298873', 'fid_1740617298873_13', 'การทำหมัน', 'text', 'การทำหมัน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1847, 'fid_1740617298873', 'fid_1740617298873_14', 'ปีเกิด', 'text', 'ปีเกิด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1848, 'fid_1740617298873', 'fid_1740617298873_15', 'อายุ-ปี', 'text', 'อายุ-ปี') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1849, 'fid_1740617298873', 'fid_1740617298873_16', 'ลักษณะการเลี้ยง', 'text', 'ลักษณะการเลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1850, 'fid_1740617298873', 'fid_1740617298873_17', 'สถานที่เลี้ยง', 'text', 'สถานที่เลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1852, 'fid_1740617298873', 'fid_1740617298873_19', 'รอบที่', 'text', 'รอบที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1853, 'fid_1740617298873', 'fid_1740617298873_20', 'วันที่บันทึกข้อมูล', 'text', 'วันที่บันทึกข้อมูล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1854, 'fid_1740617298873', 'fid_1740617298873_21', 'ผู้บันทึก', 'text', 'ผู้บันทึก') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1855, 'fid_1740617298873', 'fid_1740617298873_22', 'วันที่ปรับปรุงข้อมูลล่าสุด', 'text', 'วันที่ปรับปรุงข้อมูลล่าสุด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1856, 'fid_1740617298873', 'fid_1740617298873_23', 'ผู้ปรับปรุง', 'text', 'ผู้ปรับปรุง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1857, 'fid_1740617298873', 'fid_1740617298873_24', 'อนุมัติโดย', 'text', 'อนุมัติโดย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1858, 'fid_1740617298873', 'fid_1740617298873_25', 'วันที่อนุมัติ', 'text', 'วันที่อนุมัติ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1859, 'fid_1740617298873', 'fid_1740617298873_26', 'สถานะ', 'text', 'สถานะ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1860, 'fid_1740617812746', 'fid_1740617812746_0', 'ชื่อ-นามสกุล', 'text', 'ชื่อ-นามสกุล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1861, 'fid_1740617812746', 'fid_1740617812746_1', 'หมายเลขบัตรประชาชน', 'text', 'หมายเลขบัตรประชาชน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1862, 'fid_1740617812746', 'fid_1740617812746_2', 'เบอร์โทรศัพท์', 'text', 'เบอร์โทรศัพท์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1863, 'fid_1740617812746', 'fid_1740617812746_3', 'hhcode', 'text', 'hhcode') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1864, 'fid_1740617812746', 'lat', 'lat', 'numeric', 'lat') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1865, 'fid_1740617812746', 'lng', 'lng', 'numeric', 'lng') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1866, 'fid_1740617812746', 'fid_1740617812746_6', 'บ้านเลขที่', 'text', 'บ้านเลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1867, 'fid_1740617812746', 'fid_1740617812746_7', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1868, 'fid_1740617812746', 'fid_1740617812746_8', 'ประเภท', 'text', 'ประเภท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1869, 'fid_1740617812746', 'fid_1740617812746_9', 'ชื่อ/อัตลักษณ์', 'text', 'ชื่อ/อัตลักษณ์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1870, 'fid_1740617812746', 'fid_1740617812746_10', 'เพศ', 'text', 'เพศ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1871, 'fid_1740617812746', 'fid_1740617812746_11', 'การฉีดวัคซีน', 'text', 'การฉีดวัคซีน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1872, 'fid_1740617812746', 'fid_1740617812746_12', 'การทำหมัน', 'text', 'การทำหมัน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1873, 'fid_1740617812746', 'fid_1740617812746_13', 'ปีเกิด', 'text', 'ปีเกิด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1874, 'fid_1740617812746', 'fid_1740617812746_14', 'อายุ-ปี', 'text', 'อายุ-ปี') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1875, 'fid_1740617812746', 'fid_1740617812746_15', 'ลักษณะการเลี้ยง', 'text', 'ลักษณะการเลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1876, 'fid_1740617812746', 'fid_1740617812746_16', 'สถานที่เลี้ยง', 'text', 'สถานที่เลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1877, 'fid_1740617812746', 'fid_1740617812746_17', 'ปีสำรวจ', 'text', 'ปีสำรวจ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1878, 'fid_1740617812746', 'fid_1740617812746_18', 'รอบที่', 'text', 'รอบที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1879, 'fid_1740617812746', 'fid_1740617812746_19', 'วันที่บันทึกข้อมูล', 'text', 'วันที่บันทึกข้อมูล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1880, 'fid_1740617812746', 'fid_1740617812746_20', 'ผู้บันทึก', 'text', 'ผู้บันทึก') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1881, 'fid_1740617812746', 'fid_1740617812746_21', 'วันที่ปรับปรุงข้อมูลล่าสุด', 'text', 'วันที่ปรับปรุงข้อมูลล่าสุด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1882, 'fid_1740617812746', 'fid_1740617812746_22', 'ผู้ปรับปรุง', 'text', 'ผู้ปรับปรุง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1883, 'fid_1740617812746', 'fid_1740617812746_23', 'อนุมัติโดย', 'text', 'อนุมัติโดย') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1884, 'fid_1740617812746', 'fid_1740617812746_24', 'วันที่อนุมัติ', 'text', 'วันที่อนุมัติ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1885, 'fid_1740617812746', 'fid_1740617812746_25', 'สถานะ', 'text', 'สถานะ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (519, 'fid_1709612556696', 'fid_1709612556696_1', 'เบอร์โทรศัพท์', 'text', 'เบอร์โทรศัพท์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (520, 'fid_1709612556696', 'lat', 'ละติจูด', 'numeric', 'ละติจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (521, 'fid_1709612556696', 'lng', 'ลองจิจูด', 'numeric', 'ลองจิจูด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (522, 'fid_1709612556696', 'fid_1709612556696_4', 'บ้านเลขที่', 'text', 'บ้านเลขที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (523, 'fid_1709612556696', 'fid_1709612556696_5', 'หมู่ที่', 'text', 'หมู่ที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (524, 'fid_1709612556696', 'fid_1709612556696_6', 'ประเภท', 'text', 'ประเภท') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (525, 'fid_1709612556696', 'fid_1709612556696_7', 'ชื่อ/อัตลักษณ์', 'text', 'ชื่อ/อัตลักษณ์') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (526, 'fid_1709612556696', 'fid_1709612556696_8', 'เพศ', 'text', 'เพศ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (527, 'fid_1709612556696', 'fid_1709612556696_9', 'การฉีดวัคซีน', 'text', 'การฉีดวัคซีน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (528, 'fid_1709612556696', 'fid_1709612556696_10', 'วัคซีนครั้งล่าสุด', 'text', 'วัคซีนครั้งล่าสุด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (529, 'fid_1709612556696', 'fid_1709612556696_11', 'การทำหมัน', 'text', 'การทำหมัน') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (530, 'fid_1709612556696', 'fid_1709612556696_12', 'ปีเกิด', 'text', 'ปีเกิด') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (531, 'fid_1709612556696', 'fid_1709612556696_13', 'อายุ-ปี', 'text', 'อายุ-ปี') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (532, 'fid_1709612556696', 'fid_1709612556696_14', 'ลักษณะการเลี้ยง', 'text', 'ลักษณะการเลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (533, 'fid_1709612556696', 'fid_1709612556696_15', 'สถานที่เลี้ยง', 'text', 'สถานที่เลี้ยง') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (534, 'fid_1709612556696', 'fid_1709612556696_16', 'ปีสำรวจ', 'text', 'ปีสำรวจ') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (535, 'fid_1709612556696', 'fid_1709612556696_17', 'รอบที่', 'text', 'รอบที่') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (536, 'fid_1709612556696', 'fid_1709612556696_18', 'วันที่บันทึกข้อมูล', 'text', 'วันที่บันทึกข้อมูล') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1889, 'fid_1743479699326', 'fid_1743479699326_0', 'xx', 'TEXT', 'xx') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1890, 'fid_1743479699326', 'fid_1743479699326_2', 'vv', 'DATE', 'vv') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1891, 'fid_1743479699326', 'fid_1743479699326_1', 'cc', 'NUMERIC', 'cc') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1892, 'fid_1743479699326', 'fid_1743479699326_3', 'bb', 'TEXT', 'bb') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1893, 'fid_1743480585554', 'fid_1743480585554_0', 'pp', 'text', 'pp') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1894, 'fid_1743480585554', 'fid_1743480585554_3', 'mm', 'text', 'mm') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1895, 'fid_1743480585554', 'fid_1743480585554_2', 'dd', 'date', 'dd') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1896, 'fid_1743480585554', 'fid_1743480585554_1', 'ii', 'numeric', 'ii') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1897, 'fid_1743658674655', 'fid_1743658674655_0', 'gg', 'text', 'gg') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1898, 'fid_1743658674655', 'fid_1743658674655_2', 'jj', 'date', 'jj') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1899, 'fid_1743658674655', 'fid_1743658674655_3', 'kk', 'file', 'kk') ON CONFLICT DO NOTHING;
INSERT INTO public.layer_column (gid, formid, col_id, col_name, col_type, col_desc) VALUES (1900, 'fid_1743658674655', 'fid_1743658674655_1', 'hh', 'numeric', 'hh') ON CONFLICT DO NOTHING;


--
-- TOC entry 4288 (class 0 OID 17510)
-- Dependencies: 225
-- Data for Name: layer_division; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4290 (class 0 OID 17517)
-- Dependencies: 227
-- Data for Name: layer_name; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4119 (class 0 OID 16707)
-- Dependencies: 219
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4292 (class 0 OID 17523)
-- Dependencies: 229
-- Data for Name: tb_info; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tb_info (id, name, img) VALUES (1, '(ใส่ชื่อเทศบาล)', 'data:image/png;base64,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') ON CONFLICT DO NOTHING;


--
-- TOC entry 4294 (class 0 OID 17529)
-- Dependencies: 231
-- Data for Name: tb_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tb_user (id, username, email, pass, ts, auth, division, userid, picture_url, created_at, updated_at, displayname, provider) VALUES (7, 'ชวิศ ศรีมณี', 'chawis.srimanee@gmail.com', '$2a$10$N.8Lrle2NIjPPEwugq7zI.dRGBZXmMjrz93BwsRJpjC5brk3xhoBy', '2024-03-06 04:33:45.998959', 'admin', 'สำนักปลัดฝ่ายอำนวยการ', NULL, NULL, NULL, NULL, NULL, 'line') ON CONFLICT DO NOTHING;
INSERT INTO public.tb_user (id, username, email, pass, ts, auth, division, userid, picture_url, created_at, updated_at, displayname, provider) VALUES (108, 'sakda ka poon', 'sakda@mail.com', NULL, '2025-03-27 09:56:53.072079', 'admin', 'tt', 'Ue340022c2f6d6c989a3c4120991d90d1', 'https://profile.line-scdn.net/0hjiX1HNi-NUZ1SBrAnfNLOQUYNixWOWxUWi8vIUVIaX9NeSVEDntyKBJIbyYbeXFFX3lyJkJLP3N5W0Igax7JcnJ4aHdJfnMWWS1ypw', '2025-03-27 09:56:53.072079', '2025-04-30 14:21:05.634274', 'sakda.homhuan', 'line') ON CONFLICT DO NOTHING;


--
-- TOC entry 4308 (class 0 OID 0)
-- Dependencies: 224
-- Name: layer_column_gid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.layer_column_gid_seq', 1900, true);


--
-- TOC entry 4309 (class 0 OID 0)
-- Dependencies: 226
-- Name: layer_division_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.layer_division_id_seq', 62, true);


--
-- TOC entry 4310 (class 0 OID 0)
-- Dependencies: 228
-- Name: layer_name_gid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.layer_name_gid_seq', 235, true);


--
-- TOC entry 4311 (class 0 OID 0)
-- Dependencies: 230
-- Name: tb_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tb_info_id_seq', 2, true);


--
-- TOC entry 4312 (class 0 OID 0)
-- Dependencies: 232
-- Name: tb_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tb_user_id_seq', 304, true);


--
-- TOC entry 4131 (class 2606 OID 18691)
-- Name: layer_name layer_name_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.layer_name
    ADD CONSTRAINT layer_name_pkey PRIMARY KEY (formid);


--
-- TOC entry 4133 (class 2606 OID 18693)
-- Name: tb_info tb_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tb_info
    ADD CONSTRAINT tb_info_pkey PRIMARY KEY (id);


--
-- TOC entry 4135 (class 2606 OID 18695)
-- Name: tb_user unique_userid; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tb_user
    ADD CONSTRAINT unique_userid UNIQUE (userid);


-- Completed on 2025-04-30 21:25:29 +07

--
-- PostgreSQL database dump complete
--

