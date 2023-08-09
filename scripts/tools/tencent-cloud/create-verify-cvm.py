#coding: utf-8
import dotenv, os, time, sys, tools, argparse

parser = argparse.ArgumentParser(description="TencentCloud")
parser.add_argument("--image", type=str, required=False, help="The CVM image id")

args = parser.parse_args()

if os.path.exists(f'{os.getenv("HOME")}/.lighthouse/.env'):
    dotenv.load_dotenv(dotenv.find_dotenv(filename=f'{os.getenv("HOME")}/.lighthouse/.env'))
else:
    dotenv.load_dotenv(dotenv.find_dotenv())

if os.getenv("VM_IMAGE") is not None and args.image is None:
    args.image = os.getenv("VM_IMAGE")
if args.image == None:
    raise Exception("Please set --image")

if os.getenv("SECRET_ID") == None:
    print("Please set SECRET_ID in .env or ~/.lighthouse/.env file")
    exit(1)
if os.getenv("SECRET_KEY") == None:
    print("Please set SECRET_KEY in .env or ~/.lighthouse/.env file")
    exit(1)
if os.getenv("VM_TOKEN") == None:
    print("Please set VM_TOKEN in .env or ~/.lighthouse/.env file")
    exit(1)

region = "ap-beijing"
image_id = args.image
print(f"Select image: {image_id}, {region}")

instance_quotas = tools.get_zone_instance(region)['InstanceTypeQuotaSet']
if len(instance_quotas) == 0:
    raise Exception("No instance type found")
instance_candidates = []
for v in instance_quotas:
    if v['Cpu'] != 2 or v['Fpga'] != 0 or v['Gpu'] != 0 or v['Memory'] != 2 or v['Status'] != 'SELL':
        continue
    instance_candidates.append(v)
if len(instance_candidates) == 0:
    raise Exception("No instance type found")
zone = instance_candidates[0]['Zone']
instance_type = instance_candidates[0]['InstanceType']
vm_token = os.getenv("VM_TOKEN")
print(f"Create CVM in region={region}, zone={zone}, instance={instance_type}, image={image_id}, vm_token={vm_token}")

disk = 10
network = 30
instance_ids = tools.create_instance(region, zone, instance_type, image_id, disk, network, vm_token)['InstanceIdSet']
print(f"Created instances {instance_ids}")
if len(instance_ids) < 1:
    raise Exception("Create instance failed")

instance_id = instance_ids[0]
print(f"CVM instance={instance_id}, region={region}, zone={zone}, instance={instance_type}, image={image_id}, disk={disk}GB, network={network}Mbps")

while True:
    instance_states = tools.query_instance_status(region, instance_id)['InstanceStatusSet']
    if len(instance_states) != 1:
        raise Exception(f"Instance {instance_id} status not found")
    instance_state = instance_states[0]
    if instance_state['InstanceState'] == 'RUNNING':
        print(f"Instance {instance_id} is running")
        break
    print(f"Instance {instance_id} is {instance_state['InstanceState']}, wait 3 seconds")
    time.sleep(3)

instance_details = tools.query_instance_detail(region, instance_id)['InstanceSet']
if len(instance_details) != 1:
    raise Exception(f"Instance {instance_id} detail not found")
instance_detail = instance_details[0]
print(f"Instance {instance_id}, public ip={instance_detail['PublicIpAddresses'][0]}, private ip={instance_detail['PrivateIpAddresses'][0]}")

# print the instance id to stderr.
print(instance_id, file=sys.stderr)
