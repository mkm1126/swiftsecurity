/*
  # Create Agency Business Units Table

  1. New Tables
    - `agency_business_units`
      - `id` (uuid, primary key)
      - `agency_code` (character(3), not null)
      - `agency_name` (text, not null)
      - `business_unit_code` (character(5), not null)
      - `business_unit_name` (text, not null)
      - `created_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `agency_business_units` table
    - Add policy for public read access

  3. Data Import
    - Import all business unit data with proper agency mappings
*/

-- Create the agency_business_units table
CREATE TABLE IF NOT EXISTS public.agency_business_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_code character(3) NOT NULL,
  agency_name text NOT NULL,
  business_unit_code character(5) NOT NULL,
  business_unit_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_business_units ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to agency business units"
  ON public.agency_business_units
  FOR SELECT
  USING (true);

-- Create index for faster lookups by agency_code
CREATE INDEX IF NOT EXISTS idx_agency_business_units_agency_code 
  ON public.agency_business_units(agency_code);

-- Insert data based on existing business unit mappings
INSERT INTO public.agency_business_units (agency_code, agency_name, business_unit_code, business_unit_name) VALUES
-- Agriculture Department (B04)
('B04', 'Agriculture', 'B0401', 'Agriculture Department'),
('B04', 'Agriculture', 'B0402', 'Agriculture Dept - US Bank'),

-- Office of Cannabis Management (B10)
('B10', 'Cannabis Management Office', 'B1001', 'Office of Cannabis Management'),

-- Cosmetologist Examiners Board (B11)
('B11', 'Cosmetology Examiners', 'B1101', 'Cosmetologist Examiners Board'),

-- Commerce Department (B13)
('B13', 'Commerce', 'B1301', 'Commerce Department'),

-- Animal Health Board (B14)
('B14', 'Animal Health', 'B1401', 'Animal Health Board'),

-- Barber Examiners Board (B15)
('B15', 'Barber Examiners', 'B1501', 'Barber Examiners Board'),

-- Explore Minnesota Tourism (B20)
('B20', 'Explore MN Tourism', 'B2001', 'Explore Minnesota Tourism'),

-- Employment & Economic Development (B22)
('B22', 'Employment', 'B2101', 'Economic Security Dept'),
('B22', 'Employment', 'B2201', 'Employment & Economic Develop'),
('B22', 'Employment', 'B2202', 'DEED Grants and Projects'),
('B22', 'Employment', 'B2203', 'Sponsorships and Memberships'),
('B22', 'Employment', 'B2204', 'SSB'),

-- Economic Development (B24)
('B24', 'Econ Dev', 'B2401', 'Public Facilities Authority'),
('B24', 'Econ Dev', 'B2501', 'Science & Technology Authority'),
('B24', 'Econ Dev', 'B2601', 'Climate Innovn Finance Authrty'),

-- Housing Finance Agency (B34)
('B34', 'Housing Finance Agency', 'B3401', 'Housing Finance Agency'),

-- Workers Comp Court of Appeals (B41)
('B41', 'Workers Comp Court of Appeals (WCCA)', 'B4101', 'Workers'' Comp Court of Appeals'),

-- Labor and Industry Department (B42)
('B42', 'Labor & Industry', 'B4201', 'Labor and Industry Department'),
('B42', 'Labor & Industry', 'B4202', 'OSHA Compliance'),
('B42', 'Labor & Industry', 'B4203', 'BPV, Boats & Hobby Boiler'),
('B42', 'Labor & Industry', 'B4204', 'WC Vocational Rehab Unit'),
('B42', 'Labor & Industry', 'B4205', 'Labor Standards'),
('B42', 'Labor & Industry', 'B4206', 'WC Compliance, Records & Train'),
('B42', 'Labor & Industry', 'B4207', 'WC Special Compensation Fund'),
('B42', 'Labor & Industry', 'B4208', 'WC ALTERNATIVE DISPUTE RESOLUT'),

-- Iron Range Resources (B43)
('B43', 'Iron Range R&R', 'B4301', 'Iron Range Resources'),

-- Professional Boards
('B7E', 'Brd of Architect', 'B7E01', 'Architecture, Engineering Bd'),
('B7G', 'Combative Sports Commission', 'B7G01', 'Combative Sports Commission'),
('B7P', 'Accountancy Brd', 'B7P01', 'Accountancy Board'),
('B7S', 'Private Detectives Board', 'B7S01', 'Private Detectives Board'),

-- Public Utilities Commission (B82)
('B82', 'Public Utilities Commission', 'B8201', 'Public Utilities Commission'),

-- Amateur Sports Commission (B9D)
('B9D', 'Amateur Sports Commission', 'B9D01', 'Amateur Sports Commission'),

-- Agriculture Utilization Research (B9V)
('B9V', 'Agriculture Utilization Resrch', 'B9V01', 'Agriculture Utilization Resrch'),

-- Transportation Department (T79) - MNDOT Districts
('T79', 'Transportation', 'BA000', 'MNDOT District 3 Baxter'),
('T79', 'Transportation', 'BA413', 'MNDOT District 3 Remer'),
('T79', 'Transportation', 'BA415', 'MNDOT District 3 Motley'),
('T79', 'Transportation', 'BA419', 'MNDOT District 3 Little Falls'),
('T79', 'Transportation', 'BA438', 'MNDOT District 3 Aitkin'),
('T79', 'Transportation', 'BA442', 'MNDOT District 3 Pine River'),
('T79', 'Transportation', 'BA443', 'MNDOT District 3 Baxter Maint'),
('T79', 'Transportation', 'BA445', 'MNDOT District 3 Isle'),
('T79', 'Transportation', 'BA450', 'MNDOT District 3 Wadena'),
('T79', 'Transportation', 'BA458', 'MNDOT District 3 Long Prairie'),
('T79', 'Transportation', 'BA462', 'MNDOT District 3 Garrison'),
('T79', 'Transportation', 'BA468', 'MNDOT District 3 Little Falls'),
('T79', 'Transportation', 'BA471', 'MNDOT District 3 Isle'),
('T79', 'Transportation', 'BA999', 'MNDOT District 3 Sign Shop'),
('T79', 'Transportation', 'BJ000', 'MNDOT District 2 Bemidji'),
('T79', 'Transportation', 'BJ136', 'MNDOT District 2 Talmoon'),
('T79', 'Transportation', 'BJ300', 'MNDOT District 2 Yard'),
('T79', 'Transportation', 'BJ316', 'MNDOT District 2 Walker'),
('T79', 'Transportation', 'BJ317', 'MNDOT District 2 Bagley'),
('T79', 'Transportation', 'BJ318', 'MNDOT District 2 Bridge'),
('T79', 'Transportation', 'BJ319', 'MNDOT District 2 Deer River'),
('T79', 'Transportation', 'BJ320', 'MNDOT DIstrict 2 Baudette'),
('T79', 'Transportation', 'BJ321', 'MNDOT District 2 Grygla'),
('T79', 'Transportation', 'BJ322', 'MNDOT District 2 Northome'),
('T79', 'Transportation', 'BJ323', 'MNDOT District 2 Roseau'),
('T79', 'Transportation', 'BJ329', 'MNDOT District 2 Park Rapids'),
('T79', 'Transportation', 'BJ330', 'MNDOT District 2'),
('T79', 'Transportation', 'BJ999', 'MNDOT District 2 Sign Shop'),
('T79', 'Transportation', 'CM000', 'MNDOT Central Map Sales'),
('T79', 'Transportation', 'CO000', 'MNDOT Central Office Inventory'),
('T79', 'Transportation', 'CO777', 'MNDOT CO International'),
('T79', 'Transportation', 'CR000', 'MNDOT District 2 Crookston'),
('T79', 'Transportation', 'CR511', 'MNDOT District 2 Warren'),
('T79', 'Transportation', 'CR512', 'MNDOT Dist 2 Theif River Falls'),
('T79', 'Transportation', 'CR516', 'MNDOT District 2 Hallock'),
('T79', 'Transportation', 'CR517', 'MNDOT District 2 Ada'),
('T79', 'Transportation', 'CR524', 'MNDOT District 2 Erskine'),
('T79', 'Transportation', 'CR526', 'MNDOT District 2 Karlstad'),
('T79', 'Transportation', 'CR528', 'MNDOT Dist 2 East Grand Forks'),
('T79', 'Transportation', 'CR530', 'MNDOT District 2 Crookston'),
('T79', 'Transportation', 'CR999', 'MNDOT District 2 Sign Shop'),
('T79', 'Transportation', 'CS000', 'MNDOT Central Shop'),
('T79', 'Transportation', 'CS111', 'MNDOT Central Shop Plow Comp'),

-- Administration Department (G02)
('G02', 'Administration', 'G0201', 'Administration Department'),
('G02', 'Administration', 'G0202', 'Mn Geospatial Info Office'),
('G02', 'Administration', 'G0203', 'Minnesota Bookstore'),
('G02', 'Administration', 'G0204', 'Central Mail'),
('G02', 'Administration', 'G0205', 'Parking'),
('G02', 'Administration', 'G0206', 'Materials Transfer'),
('G02', 'Administration', 'G0207', 'Surplus Services'),
('G02', 'Administration', 'G0208', 'Fleet Services'),
('G02', 'Administration', 'G0209', 'Admin - Facilities Management'),
('G02', 'Administration', 'G0210', 'Admin/State Procurement'),
('G02', 'Administration', 'G0211', 'Admin - Real Estate & Constr'),
('G02', 'Administration', 'G0212', 'Admin - Risk Management'),
('G02', 'Administration', 'G0213', 'Risk Management - Workers Comp'),
('G02', 'Administration', 'G0214', 'Financial Mgmt & Reporting'),
('G02', 'Administration', 'G0215', 'Data Practices Office'),
('G02', 'Administration', 'G0216', 'Admin FMR Smart'),
('G02', 'Administration', 'G0217', 'Admin HR Smart'),
('G02', 'Administration', 'G0218', 'Admin Demography'),
('G02', 'Administration', 'G0219', 'State Hist Preservation Office'),
('G02', 'Administration', 'G0220', 'Office of State Archaeology'),

-- Other G agencies
('G03', 'Lottery', 'G0301', 'Lottery'),
('G05', 'Racing Commission (MRC)', 'G0501', 'Racing Commission'),
('G06', 'Attorney General', 'G0601', 'Attorney General'),
('G09', 'Gambling Control', 'G0901', 'Gambling Control Board'),
('G10', 'Minnesota Management & Budget', 'G1001', 'Minnesota Management & Budget'),
('G10', 'Minnesota Management & Budget', 'G1002', 'SEGIP'),
('G10', 'Minnesota Management & Budget', 'G8H01', 'MMB Higher Education'),
('G10', 'Minnesota Management & Budget', 'G8S01', 'MMB Intergovernmental Aids'),
('G10', 'Minnesota Management & Budget', 'G9Q01', 'MMB Debt Service'),
('G10', 'Minnesota Management & Budget', 'G9R01', 'MMB Non-Operating'),
('G10', 'Minnesota Management & Budget', 'G9T01', 'MMB Treasury Non Operating'),

-- Health Department (H12)
('H12', 'Health', 'H1201', 'Health Department'),
('H12', 'Health', 'SSC00', 'MDH Support Services Center'),
('H12', 'Health', 'LAB00', 'MDH/MDA Lab'),

-- Health Licensing Boards
('H7B', 'Medical Practice Board', 'H7B01', 'Medical Practice Board'),
('H7C', 'Nursing Board', 'H7C01', 'Nursing Board'),
('H7D', 'Pharmacy Board', 'H7D01', 'Pharmacy Board'),
('H7F', 'Dentistry Board', 'H7F01', 'Dentistry Board'),
('H7H', 'Chiropractic Examiners Board', 'H7H01', 'Chiropractic Examiners Board'),
('H7J', 'Optometry Board', 'H7J01', 'Optometry Board'),
('H7K', 'Exec for LT Svcs & Supports Bd', 'H7K01', 'Exec for LT Svcs & Supports Bd'),
('H7L', 'Social Work Board', 'H7L01', 'Social Work Board'),
('H7M', 'Marriage & Family Therapy Board', 'H7M01', 'Marriage and Family Therapy Bd'),
('H7Q', 'Podiatric Medicine Board', 'H7Q01', 'Podiatric Medicine'),
('H7R', 'Veterinary Medicine Board', 'H7R01', 'Veterinary Medicine Board'),
('H7S', 'Emergency Medical Services Regulatory', 'H7S01', 'Emergency Medical Services Off'),
('H7U', 'Dietetics & Nutrition Practice Board', 'H7U01', 'Dietetics & Nutrition Practice'),
('H7V', 'Psychology Board', 'H7V01', 'Psychology Board'),
('H7W', 'Physical Therapy Board', 'H7W01', 'Physical Therapy Board'),
('H7X', 'Behaviorial Health Board', 'H7X01', 'Behavioral Health & Therapy Bd'),
('H7Y', 'Occupational Therapy Practice Board', 'H7Y01', 'Occupational Therapy Pract Bd'),

-- Human Services (H55)
('H55', 'Human Services', 'H5501', 'Human Services Department'),
('H55', 'Human Services', 'H5502', 'Grants and Projects'),
('H55', 'Human Services', 'H5503', 'HealthCare Recoveries'),
('H55', 'Human Services', 'H5504', 'Other Counties and Tribes'),
('H55', 'Human Services', 'H5505', 'Parent Fees'),
('H55', 'Human Services', 'H5506', 'Parent Usage'),
('H55', 'Human Services', 'H5507', 'Estate Claims'),
('H55', 'Human Services', 'H5508', 'Licensing'),
('H55', 'Human Services', 'H5509', 'DHS Other'),
('H55', 'Human Services', 'H5510', 'SOS Business Office'),
('H55', 'Human Services', 'H5511', 'MSOP Business Office'),
('H55', 'Human Services', 'H5512', 'MAEPD'),
('H55', 'Human Services', 'H5513', 'Alternative Care'),
('H55', 'Human Services', 'H5514', 'MSHO'),
('H55', 'Human Services', 'H5515', 'MDHO'),
('H55', 'Human Services', 'H5516', 'Special Needs Basic Care'),
('H55', 'Human Services', 'H5517', 'Nursing Home Surcharge'),
('H55', 'Human Services', 'H5518', 'Hospital Surcharge'),
('H55', 'Human Services', 'H5519', 'HMO Surcharge'),
('H55', 'Human Services', 'H5520', 'ICFDD Surcharge'),
('H55', 'Human Services', 'H5521', 'ECPN'),
('H55', 'Human Services', 'H5522', 'SIRS'),
('H55', 'Human Services', 'H5523', 'MinnesotaCare Operations'),
('H55', 'Human Services', 'H5524', 'NSR'),
('H55', 'Human Services', 'H5525', 'MinnesotaCare Overpayments'),
('H55', 'Human Services', 'H5526', 'PROVIDER CREDIT BALANCES'),
('H55', 'Human Services', 'H5599', 'DHS - DOR Collections'),

-- Direct Care and Treatment (H51)
('H51', 'Direct Care and Treatment (DCT)', 'H5101', 'Direct Care and Treatment'),
('H51', 'Direct Care and Treatment (DCT)', 'H5110', 'DCT Billing'),
('H51', 'Direct Care and Treatment (DCT)', 'H5111', 'MSI Billing'),

-- Children, Youth & Families (H58)
('H58', 'HS Children, Youth & Family (DCYF)', 'H5801', 'Children Youth & Families Dept'),

-- Veterans Affairs (H75)
('H75', 'Veterans Affairs', 'H7501', 'Veterans Affairs Department'),

-- Education Department (E37)
('E37', 'Education', 'E3701', 'Education Department'),
('E37', 'Education', 'E3702', 'Dept of Education –Non-Federal'),

-- Other Education agencies
('E25', 'Perpich Ctr for Arts Education', 'E2501', 'Perpich Ctr For Arts Education'),
('E26', 'MinnState', 'E2601', 'MN State Colleges/Universities'),
('E39', 'Prof. Educ. Lic. & Stand. Bd.', 'E3901', 'Prof Educator Licensing Std Bd'),
('E44', 'Mn State Academies', 'E4401', 'Minnesota State Academies'),
('E50', 'Arts Board', 'E5001', 'Arts Board'),
('E60', 'Office of Higher Education', 'E6001', 'Office of Higher Education'),
('E77', 'Zoo', 'E7701', 'Zoological Board'),

-- Judicial (J33)
('J33', 'Judicial', 'J3301', 'Trial Courts'),
('J40', 'Guardian Ad Litem', 'J5001', 'State Guardian Ad Litem'),
('J50', 'Court of Appeals', 'J5801', 'Court of Appeals'),
('J52', 'Public Defense', 'J5201', 'Public Defense Board'),
('J58', 'Supreme Court', 'J6501', 'Supreme Court'),
('J65', 'State Competency Attainment Board', 'J4001', 'STATE COMPETENCY ATTAINMENT BD'),
('J68', 'Tax Court', 'J6801', 'Tax Court'),
('J70', 'Judicial Standards Brd', 'J7001', 'Judicial Standards Board'),

-- Legislature
('L10', 'Leg Coord Comm (LCC)', 'L1001', 'Legislature Coordinating Comm'),
('L11', 'Senate', 'L1101', 'Senate'),
('L49', 'Legislative Auditor', 'L4901', 'Legislative Auditor'),

-- Military Affairs (P01)
('P01', 'Military Affairs', 'P0101', 'Military Affairs Department'),

-- Public Safety (P07)
('P07', 'Public Safety', 'P0701', 'Public Safety Department'),
('P07', 'Public Safety', 'P0702', 'Homeland Security'),
('P07', 'Public Safety', 'P0703', 'BCA'),
('P07', 'Public Safety', 'P0704', 'Fire Marshal'),
('P07', 'Public Safety', 'P0705', 'State Patrol'),
('P07', 'Public Safety', 'P0706', 'AGED'),
('P07', 'Public Safety', 'P0707', 'DVS'),
('P07', 'Public Safety', 'P0708', 'Pipeline Safety'),

-- Corrections (P78)
('P78', 'Corrections', 'P7801', 'Corrections Department'),

-- Natural Resources (R29)
('R29', 'Natural Resources', 'R2901', 'Natural Resources Department'),
('R29', 'Natural Resources', 'R2801', 'Minn Conservation Corps'),

-- Pollution Control (R32)
('R32', 'Pollution Control', 'R3201', 'Pollution Control Agency'),

-- Water & Soil (R9P)
('R9P', 'Water & Soil', 'R9P01', 'Water and Soil Resources Board'),

-- Revenue (G67)
('G67', 'Revenue', 'G6701', 'Revenue Department'),
('G67', 'Revenue', 'G9001', 'Revenue Intergovt Payments'),

-- Secretary of State (G53)
('G53', 'Secy of State', 'G5301', 'Secretary of State'),

-- State Auditor (G61)
('G61', 'State Auditor', 'G6101', 'Office of State Auditor'),

-- Retirement Systems
('G62', 'MN State Retirement System', 'G6201', 'Minn State Retirement System'),
('G63', 'Public Employees Retire Assoc', 'G6301', 'Public Employees Retire Assoc'),
('G63', 'Public Employees Retire Assoc', 'G6302', 'PERA - US BANK'),
('G69', 'Teacher''s Retirement', 'G6901', 'Teachers Retirement Assoc'),

-- MN.IT (G46)
('G46', 'MN.IT', 'G4601', 'MN.IT'),

-- Investment Board (G38)
('G38', 'Investment Board', 'G3801', 'Investment Board'),

-- Governor's Office (G39)
('G39', 'Governors Office', 'G3901', 'Governors Office'),

-- Additional MNDOT business units (continuing Transportation T79)
('T79', 'Transportation', 'DL000', 'MNDOT District 4'),
('T79', 'Transportation', 'DL611', 'MNDOT District 4 Brknrdge'),
('T79', 'Transportation', 'DL615', 'MNDOT District 4 Fergus Falls'),
('T79', 'Transportation', 'DL616', 'MNDOT District 4 DL TS'),
('T79', 'Transportation', 'DL623', 'MNDOT District 4 Moorhead'),
('T79', 'Transportation', 'DL624', 'MNDOT District 4 Barnsville'),
('T79', 'Transportation', 'DL625', 'MNDOT District 4 Perham'),
('T79', 'Transportation', 'DL629', 'MNDOT District 4 Hawley'),
('T79', 'Transportation', 'DL636', 'MNDOT District 4 Henning'),
('T79', 'Transportation', 'DL640', 'MNDOT District 4 Mahnomen'),
('T79', 'Transportation', 'DL654', 'MNDOT District 4 Pelican Rapid'),
('T79', 'Transportation', 'DL771', 'MNDOT DOT DIST 4 ERHARD PIT'),
('T79', 'Transportation', 'DL915', 'MNDOT District 4 FF Field Mech'),
('T79', 'Transportation', 'DL916', 'MNDOT District 4 DL Field Mech'),
('T79', 'Transportation', 'DL999', 'MNDOT District 4 Sign Shop'),

-- Continue with remaining MNDOT districts and other agencies...
('T79', 'Transportation', 'T7901', 'Transportation Department'),
('T79', 'Transportation', 'T7902', 'Transportation Restitution'),
('T79', 'Transportation', 'T7903', 'Transportation Misc Interest'),
('T79', 'Transportation', 'T7904', 'Transportation Joint Projects'),
('T79', 'Transportation', 'T79FA', 'Transportation Project Billing');

-- Add a unique constraint to prevent duplicate entries
ALTER TABLE public.agency_business_units 
ADD CONSTRAINT unique_agency_business_unit 
UNIQUE (agency_code, business_unit_code);