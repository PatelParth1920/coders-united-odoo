# VendorBridge

VendorBridge is an ERP-based vendor management system built with custom addons.

## Project Structure

```text
vendorbridge/
│
├── docker/             # Docker configuration files
├── config/             # Configuration templates and settings
├── docs/               # Project documentation
├── scripts/            # Utility and deployment scripts
│
├── custom_addons/      # Custom Odoo addons
│   ├── vb_core/        # Core utilities and modifications
│   ├── vb_vendor/      # Vendor registration and profile management
│   ├── vb_rfq/         # Request for Quotation workflow
│   ├── vb_quotation/   # Vendor quotation submission
│   ├── vb_approval/    # Approval flows for RFQs and purchase orders
│   ├── vb_purchase/    # Purchase order generation and management
│   ├── vb_invoice/     # Vendor invoicing and payment tracking
│   ├── vb_reports/     # Analytics and business reporting
│   ├── vb_activity/    # Activity log and notifications
│   └── vb_dashboard/   # Interactive KPI dashboards
│
├── requirements.txt    # Python requirements
├── docker-compose.yml  # Docker compose setup
├── README.md           # Documentation (this file)
└── .env                # Local environment variables configuration
```

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/get-started) and Docker Compose installed.
- Python 3.10+ (for local linting or development).

### Run with Docker Compose
1. Copy the `.env` template and set your secure passwords (already initialized for local dev).
2. Start the services:
   ```bash
   docker compose up -d
   ```
3. Access Odoo in your browser at `http://localhost:8069`.

### Adding Custom Addons to Odoo
The custom addons in `custom_addons/` are mounted to `/mnt/extra-addons` in the container.
To install a module:
1. Log in to Odoo as an Administrator.
2. Enable Developer Mode (Settings -> Activate the developer mode).
3. Go to Apps -> click "Update Apps List".
4. Search for any `vb_*` module and click "Activate".
